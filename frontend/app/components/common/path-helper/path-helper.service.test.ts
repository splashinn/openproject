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

import {PathHelperService} from './path-helper.service';

describe('PathHelper', function() {
  var PathHelper:PathHelperService;

  beforeEach(angular.mock.module('openproject.helpers'));
  beforeEach(inject(function(_PathHelper_:PathHelperService) {
    PathHelper = _PathHelper_;
  }));

  context('apiV3', function() {
    var projectIdentifier = 'majora';

    it('should provide the project\'s path', function() {
      expect(PathHelper.apiV3ProjectPath(projectIdentifier)).to.equal('/api/v3/projects/majora');
    });

    it('should provide a path to the project\'s categories', function() {
      expect(
        PathHelper.apiV3ProjectCategoriesPath(projectIdentifier)
      ).to.equal('/api/v3/projects/majora/categories');
    });

    it('should provide a path to the project\'s mentionable principals', function() {
      var projectId = "1";
      var term = "Maria";

      expect(
        PathHelper.apiv3MentionablePrincipalsPath(projectId, term)
      ).to.equal('/api/v3/principals?filters=' +  encodeURI('[{"status":{"operator":"!","values":["0","3"]}},{"member":{"operator":"=","values":["1"]}},{"type":{"operator":"=","values":["User"]}},{"id":{"operator":"!","values":["me"]}},{"name":{"operator":"~","values":["Maria"]}}]&sortBy=[["name","asc"]]&offset=1&pageSize=10'));
    });
  });
});
