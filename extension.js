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

const ExtensionUtils = imports.misc.extensionUtils;
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

// // for some reason the method Inhibit isn't in the schema so we can't just load the xml
// const DBusSessionManagerIface = `<node>
//     <interface name="org.gnome.SessionManager">
//         <method name="Inhibit">
//             <arg type="s" direction="in" />
//             <arg type="u" direction="in" />
//             <arg type="s" direction="in" />
//             <arg type="u" direction="in" />
//             <arg type="u" direction="out" />
//         </method>
//         <method name="Uninhibit">
//             <arg type="u" direction="in" />
//         </method>
//         <method name="GetInhibitors">
//             <arg type="ao" direction="out" />
//         </method>
//         <signal name="InhibitorAdded">
//             <arg type="o" direction="out" />
//         </signal>
//         <signal name="InhibitorRemoved">
//             <arg type="o" direction="out" />
//         </signal>
//     </interface>
// </node>`;

// const DBusSessionManagerProxy = Gio.DBusProxy.makeProxyWrapper(DBusSessionManagerIface);


// const FeatureToggle = GObject.registerClass(
//   class FeatureToggle extends QuickSettings.QuickToggle {
//     constructor() {
//       super();
//       this.cookie = null;
//       this.sessionManager = new DBusSessionManagerProxy(Gio.DBus.session, 'org.gnome.SessionManager', '/org/gnome/SessionManager');
//       this._settings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.awake');
//     }

//     inhibit() {
//       this.sessionManager.InhibitRemote("com.vixalien.awake", 0, "The Awake extension is preventing suspend", 8).then((cookie) => {
//         this.cookie = cookie;
//       });

//     }

//     uninhibit() {
//       if (this.cookie) this.sessionManager.UninhibitRemote(this.cookie);
//       this.sessionManager.GetInhibitorsRemote().then((inhibitors) => {
//         console.log(inhibitors);
//       });
//     }


//     _init() {
//       super._init({
//         label: "Awake",
//         iconName: 'face-yawn-symbolic',
//         toggleMode: true,
//       });

//       this.visible = true;
//       // Binding the toggle to a GSettings key

//       this.settings.bind('enabled', this, 'checked', Gio.SettingsBindFlags.DEFAULT);
//       this.settings.connect('changed::enabled', () => {
//         if (this.checked) {
//           this.inhibit();
//         } else {
//           this.uninhibit();
//         }
//       });

//       this.connect('destroy', () => {
//         this.quickSettingsItems.forEach(item => item.destroy());
//       });

//       // Add the indicator to the panel and the toggle to the menu
//       // QuickSettingsMenu._indicators.add_child(this);
//       QuickSettingsMenu._addItems(this);
//     }
//   }
// )

const AwakeToggle = GObject.registerClass(
  class AwakeToggle extends QuickSettings.QuickToggle {
    _init() {
      super._init({
        label: "Awake",
        iconName: 'face-yawn-symbolic',
        toggleMode: true,
      });

      // Binding the toggle to a GSettings key
      this._settings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.awake');

      this._settings.bind('enabled', this, 'checked', Gio.SettingsBindFlags.DEFAULT);
    }
  }
)

const AwakeIndicator = GObject.registerClass(
  class AwakeIndicator extends QuickSettings.SystemIndicator {
    _init() {
      super._init();

      // Create the icon for the indicator
      this._indicator = this._addIndicator();
      this._indicator.icon_name = 'face-yawn-symbolic';

      // Showing the indicator when the feature is enabled
      this._settings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.awake');

      this._settings.bind('enabled', this._indicator, 'visible', Gio.SettingsBindFlags.DEFAULT);

      // Create the toggle and associate it with the indicator, being sure to
      // destroy it along with the indicator
      this.quickSettingsItems.push(new AwakeToggle());

      this.connect('destroy', () => {
        console.log("\n\n\n\n\n\n\n DESTROYED \n\n\n\n\n\n\n")
        console.log(this.quickSettingsItems);
        // this.quickSettingsItems.forEach(item => item.destroy());
      });

      // Add the indicator to the panel and the toggle to the menu
      QuickSettingsMenu._indicators.add_child(this);
      QuickSettingsMenu._addItems(this.quickSettingsItems);
    }
  }
)

class Extension {
  constructor() {
    this._indicator = null;
  }

  enable() {
    this._indicator = new AwakeIndicator();
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}

function init() {
  return new Extension();
}
