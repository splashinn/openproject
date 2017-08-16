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

import {Field, FieldFactory} from '../../wp-field/wp-field.module';
import {WorkPackageChangeset} from '../../wp-edit-form/work-package-changeset';
import {$injectFields} from '../../angular/angular-injector-bridge.functions';

export class EditField extends Field {
  public template:string;
  protected I18n:op.I18n;

  constructor(public changeset:WorkPackageChangeset,
              public name:string,
              public schema:op.FieldSchema) {
    super(changeset.workPackage, name, schema);
    $injectFields(this, 'I18n');
    this.initialize();
  }

  public get inFlight() {
    return this.changeset.inFlight;
  }

  public get value() {
    return this.changeset.value(this.name);
  }

  public set value(value:any) {
    this.changeset.setValue(this.name, this.parseValue(value));
  }

  public get placeholder() {
    if (this.name === 'subject') {
      return this.I18n.t('js.placeholders.subject');
    }

    return '';
  }

  /**
   * Initialize the field after constructor was called.
   */
  protected initialize() {
  }

  /**
   * Parse the value from the model for setting
   */
  protected parseValue(val:any) {
    return val;
  }
}

export class EditFieldFactory extends FieldFactory {

  public static create(changeset:WorkPackageChangeset,
                       fieldName:string,
                       schema:op.FieldSchema):EditField {
    let type = this.getType(schema.type);
    let fieldClass = this.classes[type];

    return new fieldClass(changeset, fieldName, schema);
  }

  protected static fields:{ [field:string]:string } = {};
  protected static classes:{ [type:string]:typeof EditField } = {};
}
