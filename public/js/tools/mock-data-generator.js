/* ==========================================================================
   MOCK DATA GENERATOR v1 — public/js/tools/mock-data-generator.js
   Value.Codes | All data generation runs 100% client-side.
   ========================================================================== */

(function () {
  'use strict';

  /* ---- Data pools ---- */
  var FIRST = ['James','Emma','Liam','Olivia','Noah','Ava','William','Sophia','Oliver','Isabella','Elijah','Mia','Lucas','Charlotte','Mason','Amelia','Logan','Harper','Ethan','Evelyn','Aiden','Abigail','Jackson','Emily','Sebastian','Elizabeth','Mateo','Sofia','Jack','Avery'];
  var LAST  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson'];
  var DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','protonmail.com','company.com','example.org','test.io'];
  var STREETS = ['Main St','Oak Ave','Elm St','Maple Dr','Pine Rd','Cedar Ln','Birch Blvd','Walnut Way','Willow Ct','Ash Path'];
  var CITIES  = ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte'];
  var STATES  = ['CA','TX','NY','FL','PA','IL','OH','GA','NC','MI','NJ','VA','WA','AZ','MA'];
  var COUNTRIES = ['US','UK','CA','AU','DE','FR','JP','IN','BR','MX'];
  var JOBS = ['Software Engineer','Product Manager','Data Scientist','Designer','Marketing Manager','Sales Executive','DevOps Engineer','QA Engineer','Business Analyst','Scrum Master'];
  var COMPANIES = ['Acme Corp','GlobalTech','Innovate Inc','DataFlow','CloudBase','NextGen Solutions','PeakPerformance','Synergy Ltd','CoreLogic','BrightPath'];
  var LOREM_WORDS = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam'];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pad(n, len) { return String(n).padStart(len || 2, '0'); }

  /* ---- Data generators ---- */
  var GENERATORS = {
    firstName: function() { return rand(FIRST); },
    lastName:  function() { return rand(LAST); },
    fullName:  function() { return rand(FIRST) + ' ' + rand(LAST); },
    email:     function() { return rand(FIRST).toLowerCase() + '.' + rand(LAST).toLowerCase() + randInt(1,99) + '@' + rand(DOMAINS); },
    phone:     function() { return '+1-' + randInt(200,999) + '-' + randInt(100,999) + '-' + pad(randInt(0,9999), 4); },
    address:   function() { return randInt(1,9999) + ' ' + rand(STREETS) + ', ' + rand(CITIES) + ', ' + rand(STATES); },
    city:      function() { return rand(CITIES); },
    state:     function() { return rand(STATES); },
    country:   function() { return rand(COUNTRIES); },
    zipCode:   function() { return pad(randInt(10000,99999), 5); },
    jobTitle:  function() { return rand(JOBS); },
    company:   function() { return rand(COMPANIES); },
    age:       function() { return randInt(18, 80); },
    id:        function() { return randInt(1000, 99999); },
    uuid:      function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    },
    boolean:   function() { return Math.random() > 0.5; },
    date:      function() {
      var y = randInt(1970, 2024), m = randInt(1, 12), d = randInt(1, 28);
      return y + '-' + pad(m) + '-' + pad(d);
    },
    datetime:  function() {
      var y=randInt(2020,2025), mo=randInt(1,12), d=randInt(1,28), h=randInt(0,23), mi=randInt(0,59), s=randInt(0,59);
      return y+'-'+pad(mo)+'-'+pad(d)+'T'+pad(h)+':'+pad(mi)+':'+pad(s)+'Z';
    },
    url:       function() { return 'https://' + rand(COMPANIES).toLowerCase().replace(/\s+/g,'') + '.com'; },
    username:  function() { return (rand(FIRST) + rand(LAST) + randInt(1,99)).toLowerCase().replace(/\s/g,''); },
    password:  function() {
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      var pw = '';
      for (var i=0; i<12; i++) pw += chars[randInt(0,chars.length-1)];
      return pw;
    },
    price:     function() { return (randInt(1, 999) + randInt(0,99)/100).toFixed(2); },
    rating:    function() { return (randInt(10,50)/10).toFixed(1); },
    text:      function() {
      var len = randInt(5,15);
      var words = [];
      for (var i=0;i<len;i++) words.push(rand(LOREM_WORDS));
      return words.join(' ');
    },
    number:    function() { return randInt(1,10000); },
    color:     function() {
      return '#' + [0,0,0].map(function() { return pad(randInt(0,255).toString(16), 2); }).join('').toUpperCase();
    }
  };

  var FIELD_TYPES = Object.keys(GENERATORS);

  var DEFAULT_FIELDS = [
    { name: 'id',       type: 'id' },
    { name: 'name',     type: 'fullName' },
    { name: 'email',    type: 'email' },
    { name: 'age',      type: 'age' },
    { name: 'company',  type: 'company' }
  ];

  /* ---- DOM ---- */
  var countInput    = document.getElementById('mock-count');
  var formatSelect  = document.getElementById('mock-format');
  var tableInput    = document.getElementById('mock-table');
  var tableRow      = document.getElementById('mock-table-row');
  var fieldsList    = document.getElementById('mock-fields-list');
  var addFieldBtn   = document.getElementById('mock-add-field');
  var generateBtn   = document.getElementById('mock-generate-btn');
  var resetBtn      = document.getElementById('mock-reset-btn');
  var output        = document.getElementById('mock-output');
  var copyBtn       = document.getElementById('mock-copy-btn');
  var downloadBtn   = document.getElementById('mock-download-btn');
  var outputCount   = document.getElementById('mock-output-count');
  var toast         = document.getElementById('mock-toast');

  if (!fieldsList) return;

  var fields = JSON.parse(JSON.stringify(DEFAULT_FIELDS));

  /* ---- Format select ---- */
  if (formatSelect) {
    formatSelect.addEventListener('change', function() {
      if (tableRow) tableRow.classList.toggle('mock-hidden', this.value !== 'sql');
    });
  }

  /* ---- Render field rows ---- */
  function renderFields() {
    fieldsList.innerHTML = '';
    fields.forEach(function(f, i) {
      var row = document.createElement('div');
      row.className = 'mock-field-row';
      row.setAttribute('role', 'listitem');

      var nameIn = document.createElement('input');
      nameIn.type = 'text';
      nameIn.className = 'mock-field-name';
      nameIn.value = f.name;
      nameIn.setAttribute('aria-label', 'Field name');
      nameIn.addEventListener('input', function() { fields[i].name = this.value; });

      var typeIn = document.createElement('select');
      typeIn.className = 'mock-field-type';
      typeIn.setAttribute('aria-label', 'Field type');
      FIELD_TYPES.forEach(function(t) {
        var opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (t === f.type) opt.selected = true;
        typeIn.appendChild(opt);
      });
      typeIn.addEventListener('change', function() { fields[i].type = this.value; });

      var removeBtn = document.createElement('button');
      removeBtn.className = 'mock-field-remove';
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', 'Remove field ' + f.name);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function() {
        fields.splice(i, 1);
        renderFields();
      });

      row.appendChild(nameIn);
      row.appendChild(typeIn);
      row.appendChild(removeBtn);
      fieldsList.appendChild(row);
    });
  }

  /* ---- Add field ---- */
  if (addFieldBtn) {
    addFieldBtn.addEventListener('click', function() {
      fields.push({ name: 'field' + (fields.length + 1), type: 'text' });
      renderFields();
    });
  }

  /* ---- Reset ---- */
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      fields = JSON.parse(JSON.stringify(DEFAULT_FIELDS));
      renderFields();
    });
  }

  /* ---- Generate ---- */
  function generateRow() {
    var obj = {};
    fields.forEach(function(f) {
      var gen = GENERATORS[f.type];
      obj[f.name] = gen ? gen() : '';
    });
    return obj;
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', function() {
      var count = Math.min(1000, Math.max(1, parseInt((countInput || {}).value) || 10));
      var format = (formatSelect || {}).value || 'json';
      var rows = [];
      for (var i = 0; i < count; i++) rows.push(generateRow());

      var result = '';
      if (format === 'json') {
        result = rows.map(function(r) { return JSON.stringify(r, null, 2); }).join(',\n');
        result = '[\n' + result + '\n]';
      } else if (format === 'json-array') {
        var headers = fields.map(function(f) { return f.name; });
        result = JSON.stringify([headers].concat(rows.map(function(r) { return headers.map(function(h) { return r[h]; }); })), null, 2);
      } else if (format === 'csv') {
        var headers2 = fields.map(function(f) { return f.name; });
        var lines = [headers2.join(',')].concat(rows.map(function(r) {
          return headers2.map(function(h) {
            var v = String(r[h]);
            if (v.includes(',') || v.includes('"') || v.includes('\n')) v = '"' + v.replace(/"/g,'""') + '"';
            return v;
          }).join(',');
        }));
        result = lines.join('\n');
      } else if (format === 'sql') {
        var table = (tableInput || {}).value || 'users';
        var headers3 = fields.map(function(f) { return '`' + f.name + '`'; });
        var inserts = rows.map(function(r) {
          var vals = fields.map(function(f) {
            var v = r[f.name];
            if (typeof v === 'boolean' || typeof v === 'number') return v;
            return "'" + String(v).replace(/'/g, "''") + "'";
          });
          return 'INSERT INTO `' + table + '` (' + headers3.join(', ') + ') VALUES (' + vals.join(', ') + ');';
        });
        result = inserts.join('\n');
      }

      if (output) {
        output.value = result;
        output.removeAttribute('disabled');
      }
      if (outputCount) outputCount.textContent = count + ' rows generated';
      if (copyBtn) copyBtn.removeAttribute('disabled');
      if (downloadBtn) downloadBtn.removeAttribute('disabled');
    });
  }

  /* ---- Copy ---- */
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      if (output && navigator.clipboard) {
        navigator.clipboard.writeText(output.value).then(function() {
          showToast('Copied!');
        });
      }
    });
  }

  /* ---- Download ---- */
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      if (!output || !output.value) return;
      var fmt = (formatSelect || {}).value || 'json';
      var ext = fmt === 'csv' ? 'csv' : fmt === 'sql' ? 'sql' : 'json';
      var mime = fmt === 'csv' ? 'text/csv' : fmt === 'sql' ? 'text/sql' : 'application/json';
      var blob = new Blob([output.value], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'mock-data.' + ext;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg || 'Done!';
    toast.classList.add('cp-toast-visible');
    setTimeout(function() { toast.classList.remove('cp-toast-visible'); }, 1800);
  }

  /* ---- Init ---- */
  renderFields();

})();
