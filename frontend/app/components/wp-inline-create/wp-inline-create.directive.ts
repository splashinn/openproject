// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {onClickOrEnter} from "../wp-fast-table/handlers/click-or-enter-handler";
import {opWorkPackagesModule} from "../../angular-modules";
import {WorkPackageTableColumnsService} from "../wp-fast-table/state/wp-table-columns.service";
import {WorkPackageTableFiltersService} from '../wp-fast-table/state/wp-table-filters.service';
import {WorkPackageResourceInterface} from "../api/api-v3/hal-resources/work-package-resource.service";
import {QueryFilterInstanceResource} from '../api/api-v3/hal-resources/query-filter-instance-resource.service';
import {WorkPackageCreateService} from "../wp-create/wp-create.service";
import {WorkPackageCacheService} from "../work-packages/work-package-cache.service";
import {
  inlineCreateCancelClassName,
  InlineCreateRowBuilder,
  inlineCreateRowClassName
} from "./inline-create-row-builder";
import {scopeDestroyed$, scopedObservable} from '../../helpers/angular-rx-utils';
import {States} from '../states.service';
import {WorkPackageEditForm} from '../wp-edit-form/work-package-edit-form';
import {WorkPackageTable} from '../wp-fast-table/wp-fast-table';
import {TimelineRowBuilder} from '../wp-fast-table/builders/timeline/timeline-row-builder';
import {TableRowEditContext} from '../wp-edit-form/table-row-edit-context';
import {WorkPackageChangeset} from '../wp-edit-form/work-package-changeset';
import {WorkPackageEditingService} from '../wp-edit-form/work-package-editing-service';
import {WorkPackageFilterValues} from '../wp-edit-form/work-package-filter-values';

export class WorkPackageInlineCreateController {

  public projectIdentifier:string;
  public table:WorkPackageTable;

  public isHidden:boolean = false;
  public focus:boolean = false;

  public text:{ create:string };

  private currentWorkPackage:WorkPackageResourceInterface | null;
  private workPackageEditForm:WorkPackageEditForm | undefined;
  private rowBuilder:InlineCreateRowBuilder;
  private timelineBuilder:TimelineRowBuilder;

  constructor(public $scope:ng.IScope,
              public $element:ng.IAugmentedJQuery,
              public $timeout:ng.ITimeoutService,
              public FocusHelper:any,
              public states:States,
              public wpCacheService:WorkPackageCacheService,
              public wpEditing:WorkPackageEditingService,
              public wpCreate:WorkPackageCreateService,
              public wpTableColumns:WorkPackageTableColumnsService,
              private wpTableFilters:WorkPackageTableFiltersService,
              private AuthorisationService:any,
              private $q:ng.IQService,
              private I18n:op.I18n) {
    this.rowBuilder = new InlineCreateRowBuilder(this.table);
    this.timelineBuilder = new TimelineRowBuilder(this.table);
    this.text = {
      create: I18n.t('js.label_create_work_package')
    };

    // Mirror the row height in timeline
    const container = jQuery('.wp-table-timeline--body');
    container.addClass('-inline-create-mirror');

    // Remove temporary rows on creation of new work package
    scopedObservable(this.$scope, this.wpCreate.onNewWorkPackage())
      .subscribe((wp:WorkPackageResourceInterface) => {
        if (this.currentWorkPackage && this.currentWorkPackage === wp) {
          // Add next row
          this.removeWorkPackageRow();
          this.addWorkPackageRow();

          // Focus on the last inserted id
          this.states.focusedWorkPackage.putValue(wp.id, 'Added in inline create');
        } else {
          // Remove current row
          this.table.editing.stopEditing('new');
          this.removeWorkPackageRow();
          this.showRow();
        }
      });

    // Watch on this scope when the columns change and refresh this row
    this.states.table.columns.values$()
      .filter(() => this.isHidden) // Take only when row is inserted
      .takeUntil(scopeDestroyed$($scope)).subscribe(() => {
      const rowElement = this.$element.find(`.${inlineCreateRowClassName}`);

      if (rowElement.length && this.currentWorkPackage) {
        this.rowBuilder.refreshRow(this.currentWorkPackage,
          this.workPackageEditForm!.changeset,
          rowElement);
      }
    });

    // Cancel edition of current new row
    this.$element.on('click keydown', `.${inlineCreateCancelClassName}`, (evt) => {
      onClickOrEnter(evt, () => {
        this.resetRow();
      });

      evt.stopImmediatePropagation();
      return false;
    });

    // Additionally, cancel on escape
    Mousetrap(this.$element[0]).bind('escape', () => {
      this.resetRow();
    });
  }

  public addWorkPackageRow() {
    this.wpCreate.createNewWorkPackage(this.projectIdentifier).then((changeset:WorkPackageChangeset) => {
      if (!changeset) {
        throw 'No new work package was created';
      }

      const wp = this.currentWorkPackage = changeset.workPackage;

      // Apply filter values
      const filter = new WorkPackageFilterValues(changeset, this.wpTableFilters.current);
      filter.applyDefaultsFromFilters().then(() => {
        this.wpEditing.updateValue('new', changeset);
        this.wpCacheService.updateWorkPackage(this.currentWorkPackage!);

        // Set editing context to table
        const context = new TableRowEditContext(wp.id, this.rowBuilder.classIdentifier(wp));
        this.workPackageEditForm = WorkPackageEditForm.createInContext(context, wp, false);
        this.workPackageEditForm.changeset.clear();

        const row = this.rowBuilder.buildNew(wp, this.workPackageEditForm);
        this.$element.append(row);

        this.$timeout(() => {
          this.workPackageEditForm!.activateMissingFields();
          this.hideRow();
        });
      })
    });
  }

  /**
   * Reset the new work package row and refocus on the button
   */
  public resetRow() {
    this.focus = true;
    this.removeWorkPackageRow();
    // Manually cancelled, show the row again
    this.$timeout(() => {
      this.showRow();
    }, 50);
  }

  public removeWorkPackageRow() {
    this.currentWorkPackage = null;
    this.table.editing.stopEditing('new');
    this.states.workPackages.get('new').clear();
    this.$element.find('.wp-row-new').remove();
  }

  public showRow() {
    return this.isHidden = false;
  }

  public hideRow() {
    return this.isHidden = true;
  }

  public get colspan():number {
    return this.wpTableColumns.columnCount + 1;
  }

  public get isAllowed():boolean {
    return this.AuthorisationService.can('work_packages', 'createWorkPackage');
  }
}

function wpInlineCreate():any {
  return {
    restrict: 'AE',
    templateUrl: '/components/wp-inline-create/wp-inline-create.directive.html',

    scope: {
      table: '=',
      projectIdentifier: '='
    },

    bindToController: true,
    controllerAs: '$ctrl',
    controller: WorkPackageInlineCreateController
  }
}

opWorkPackagesModule.directive('wpInlineCreate', wpInlineCreate);
