//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2017 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2017 Jean-Philippe Lang
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
//++
/* globals URI */

import {opServicesModule} from './../../angular-modules';
import {WorkPackageResourceInterface} from 'app/components/api/api-v3/hal-resources/work-package-resource.service';
import {WorkPackageNotificationService} from './../wp-edit/wp-notification.service';
import {HalResource} from 'core-components/api/api-v3/hal-resources/hal-resource.service';

export class ActivityService {
  constructor(
    private $http:ng.IHttpService,
    private I18n:op.I18n,
    private wpNotificationsService:WorkPackageNotificationService,
    private NotificationsService:any,
    private $q:ng.IQService) {
    }

  public createComment(workPackage:WorkPackageResourceInterface, comment:string) {
    return workPackage.addComment(
      { comment: comment},
      { 'Content-Type': 'application/json; charset=UTF-8' }
    )
    .catch((error:any) => this.errorAndReject(error, workPackage));
  }

  public updateComment(activity:HalResource, comment:string) {
    var options = {
      ajax: {
        method: 'PATCH',
        data: JSON.stringify({ comment: comment }),
        contentType: 'application/json; charset=utf-8'
      }
    };

    return activity.update(
      { comment: comment },
      { 'Content-Type': 'application/json; charset=UTF-8' }
    ).then((activity:HalResource) => {
        this.NotificationsService.addSuccess(
          I18n.t('js.work_packages.comment_updated')
        );

        return activity;
    }).catch((error:any) => this.errorAndReject(error));
  }

  private errorAndReject(error:HalResource, workPackage?:WorkPackageResourceInterface) {
    this.wpNotificationsService.handleErrorResponse(error, workPackage);

    // returning a reject will enable to correctly work with subsequent then/catch handlers.
    return this.$q.reject(error);
  }
}

opServicesModule.service('wpActivityService', ActivityService);
