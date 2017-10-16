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

module API
  module V3
    module Principals
      class PrincipalsAPI < ::API::OpenProjectAPI
        helpers ::API::Utilities::ParamsHelper

        resource :principals do
          get do
            query = ::API::V3::ParamsToQueryService.new(Principal, current_user).call(params)

            if query.valid?
              users = query
                      .results
                      .where(id: Principal.in_visible_project(current_user)
                                          .or(Principal.me))
                      .includes(:preference)

              ::API::V3::Users::PaginatedUserCollectionRepresenter.new(users,
                                                     api_v3_paths.users,
                                                     page: to_i_or_nil(params[:offset]),
                                                     per_page: resolve_page_size(params[:pageSize]),
                                                     current_user: current_user)
            else
              raise ::API::Errors::InvalidQuery.new(query.errors.full_messages)
            end
          end
        end
      end
    end
  end
end
