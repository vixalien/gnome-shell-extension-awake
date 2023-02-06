/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { Gio, GObject } = imports.gi;
const { SystemIndicator, QuickToggle } = imports.ui.quickSettings;
const ExtensionUtils = imports.misc.extensionUtils;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

const Me = ExtensionUtils.getCurrentExtension();

// for some reason the method Inhibit isn't in the schema so we can't just load the xml
const DBusSessionManagerIface = `<node>
  <interface name="org.gnome.SessionManager">
    <method name="Inhibit">
      <arg type="s" direction="in" />
      <arg type="u" direction="in" />
      <arg type="s" direction="in" />
      <arg type="u" direction="in" />
      <arg type="u" direction="out" />
    </method>
    <method name="Uninhibit">
      <arg type="u" direction="in" />
    </method>
    <method name="GetInhibitors">
      <arg type="ao" direction="out" />
    </method>
    <signal name="InhibitorAdded">
      <arg type="o" direction="out" />
    </signal>
    <signal name="InhibitorRemoved">
      <arg type="o" direction="out" />
    </signal>
  </interface>
  <interface name="org.gnome.SessionManager.Inhibitor">
    <method name="GetAppId">
      <arg type="s" direction="out" />
    </method>
  </interface>
</node>`;

const DisabledIcon = 'my-caffeine-off-symbolic';
const EnabledIcon = 'my-caffeine-on-symbolic';

const DBusSessionManagerProxy = Gio.DBusProxy.makeProxyWrapper(DBusSessionManagerIface);

const AwakeToggle = GObject.registerClass(
  class AwakeToggle extends QuickToggle {
    adequate_icon() {
      return Gio.icon_new_for_string(`${Me.path}/icons/${this.settings.get_boolean('enabled') ? EnabledIcon : DisabledIcon}.svg`)
    }

    _init() {
      this.settings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.awake');

      super._init({
        label: "Keep Awake",
        gicon: this.adequate_icon(),
        toggleMode: true,
      });

      // Binding the toggle to a GSettings key

      this.settings.bind('enabled', this, 'checked', Gio.SettingsBindFlags.DEFAULT);
      this.settings.connect('changed::enabled', () => {
        this.gicon = this.adequate_icon();
      });
    }
  }
)

const AwakeIndicator = GObject.registerClass(
  class AwakeIndicator extends SystemIndicator {
    _init() {
      super._init();

      // Create the icon for the indicator
      this._indicator = this._addIndicator();
      this._indicator.gicon = Gio.icon_new_for_string(`${Me.path}/icons/${EnabledIcon}.svg`);;

      // Showing the indicator when the feature is enabled
      this.settings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.awake');

      this.settings.bind('enabled', this._indicator, 'visible', Gio.SettingsBindFlags.DEFAULT);

      // Create the toggle and associate it with the indicator, being sure to
      // destroy it along with the indicator
      this.quickSettingsItems.push(new AwakeToggle());

      this.connect('destroy', () => {
        this.quickSettingsItems.forEach(item => item.destroy());
      });

      // Add the indicator to the panel and the toggle to the menu
      QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
      QuickSettingsMenu._addItems(this.quickSettingsItems);
    }
  }
)

class Extension {
  constructor() {
    this._indicator = null;
  }

  enable() {
    this.settings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.awake');

    this._indicator = new AwakeIndicator();
    this.sessionManager = new DBusSessionManagerProxy(Gio.DBus.session, 'org.gnome.SessionManager', '/org/gnome/SessionManager');

    this.settings.connect('changed::enabled', () => {
      if (this.settings.get_boolean('enabled')) {
        this.inhibit();
      } else {
        this.uninhibit();
      }
    });
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
    this.sessionManager = null;
    this.settings = null;
    this.uninhibit();
  }

  inhibit() {
    this.sessionManager.InhibitRemote("com.vixalien.awake", 0, "The Awake extension is preventing suspend", 12, (cookie) => {
      this.cookie = cookie;
    });

  }

  uninhibit() {
    if (this.cookie) this.sessionManager.UninhibitRemote(this.cookie);
  }
}

function init() {
  return new Extension();
}
