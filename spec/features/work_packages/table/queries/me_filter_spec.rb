#-- copyright
# OpenProject is a project management system.
# Copyright (C) 2012-2017 the OpenProject Foundation (OPF)
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2017 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

require 'spec_helper'

describe 'filter me value', js: true do
  let(:project) { FactoryGirl.create :project, is_public: true }
  let(:role) { FactoryGirl.create :existing_role, permissions: [:view_work_packages] }
  let(:admin) { FactoryGirl.create :admin }
  let(:user) { FactoryGirl.create :user }
  let(:wp_admin) { FactoryGirl.create :work_package, project: project, assigned_to: admin }
  let(:wp_user) { FactoryGirl.create :work_package, project: project, assigned_to: user }

  let(:wp_table) { ::Pages::WorkPackagesTable.new(project) }
  let(:filters) { ::Components::WorkPackages::Filters.new }

  before do
    login_as admin
    project.add_member! admin, role
    project.add_member! user, role
  end

  context 'as anonymous', with_settings: { login_required?: false } do
    let(:assignee_query) do
      query = FactoryGirl.create(:query,
                                 name: 'Assignee Query',
                                 project: project,
                                 user: user)

      query.add_filter('assigned_to_id', '=', ['me'])
      query.save!(validate: false)

      query
    end


    it 'shows an error visiting a query with a me value' do
      wp_table.visit_query assignee_query
      wp_table.expect_notification(type: :error,
                                   message: I18n.t('js.work_packages.faulty_query.description'))
    end
  end

  context 'logged in' do
    before do
      wp_admin
      wp_user

      login_as(admin)
    end

    it 'shows the one work package filtering for myself' do
      wp_table.visit!
      wp_table.expect_work_package_listed(wp_admin, wp_user)

      # Add and save query with me filter
      filters.open
      filters.remove_filter 'status'
      filters.add_filter_by('Assignee', 'is', 'me')

      wp_table.expect_work_package_not_listed(wp_user)
      wp_table.expect_work_package_listed(wp_admin)

      wp_table.save_as('Me query')
      loading_indicator_saveguard

      # Expect correct while saving
      wp_table.expect_title 'Me query'
      query = Query.last
      expect(query.filters.first.values).to eq ['me']
      filters.expect_filter_by('Assignee', 'is', 'me')

      # Revisit query
      wp_table.visit_query query
      wp_table.expect_work_package_not_listed(wp_user)
      wp_table.expect_work_package_listed(wp_admin)

      filters.open
      filters.expect_filter_by('Assignee', 'is', 'me')
    end
  end
end
