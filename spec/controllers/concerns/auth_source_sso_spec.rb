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

##
# The concern is implemented in the ApplicationController and is therewore applicable
# in every controller. We're just using this particular one for the test.
describe MyController, type: :controller do
  render_views

  let(:sso_config) do
    {
      header: header,
      secret: secret
    }
  end

  let(:header) { "X-Remote-User" }
  let(:secret) { "42" }

  let(:auth_source) { DummyAuthSource.create name: "Dummy LDAP" }
  let(:user) { FactoryGirl.create :user, login: login, auth_source_id: auth_source.id }
  let(:login) { "h.wurst" }

  before do
    if sso_config
      allow(OpenProject::Configuration)
        .to receive(:auth_source_sso)
        .and_return(sso_config)
    end

    auth_source # create auth source
    user # create user

    request.headers[header] = "#{login}:#{secret}"

    get :account
  end

  it "should log in given user" do
    expect(response.body).to have_text("Login h.wurst")
  end

  shared_examples "auth source sso failure" do
    def attrs(user)
      user.attributes.slice(:login, :mail, :auth_source_id)
    end

    it "should redirect to AccountController#sso to show the error" do
      expect(response).to redirect_to "/sso"

      failure = session[:auth_source_sso_failure]

      expect(failure).to be_present
      expect(attrs(failure[:user])).to eq attrs(user)

      expect(failure[:login]).to eq login
      expect(failure[:back_url]).to eq "http://test.host/my/account"
      expect(failure[:ttl]).to eq 1
    end
  end

  context "with no auth source sso configured" do
    let(:sso_config) { nil }

    it "should redirect to login" do
      expect(response).to redirect_to("/login?back_url=http%3A%2F%2Ftest.host%2Fmy%2Faccount")
    end
  end

  context "with a non-active user user" do
    let(:user) { FactoryGirl.create :user, login: login, auth_source_id: auth_source.id, status: 2 }

    it_should_behave_like "auth source sso failure"
  end

  context "with an invalid user" do
    let(:auth_source) { DummyAuthSource.create name: "Onthefly LDAP", onthefly_register: true }

    let!(:duplicate) { FactoryGirl.create :user, mail: "login@DerpLAP.net" }
    let(:login) { "dummy_dupuser" }

    let(:user) do
      FactoryGirl.build :user, login: login, mail: duplicate.mail, auth_source_id: auth_source.id
    end

    it_should_behave_like "auth source sso failure"
  end
end
