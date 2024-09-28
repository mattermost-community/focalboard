using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Focalboard {
    internal class WebMessage {
        public string type { get; set; }
        public string settingsBlob { get; set; }
        public string key { get; set; }
    }
}
