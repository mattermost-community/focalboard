// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
using System.IO;

namespace Focalboard {
    static class Utils {
        public static string GetAppFolder() {
            string appFolder;

            try {
                appFolder = Windows.Application­Model.Package.Current.Installed­Location.Path;
            } catch {
                // Not a UWP app
                string appPath = System.Reflection.Assembly.GetExecutingAssembly().Location;
                appFolder = Path.GetDirectoryName(appPath);
            }

            return appFolder;
        }
    }
}
