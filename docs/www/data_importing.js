document.addEventListener('DOMContentLoaded', function() {
  // Fetch Datamall data via Netlify
  Shiny.addCustomMessageHandler('fetch_datamall', function(params) {
    document.getElementById('upload_conf').innerHTML =
        '<span style=\"color:#40A0E0; font-weight:bold;\">Importing from Datamall, please wait... 1/3</span>';
    const encoded_account_key = encodeURIComponent(params.account_key);
    const csv_proxy_url = 'https://brdv.netlify.app/.netlify/functions/datamall_proxy' +
        '?date=' + params.date +
        '&account_key=' + encoded_account_key;
    fetch(csv_proxy_url)
        .then(response => {
            if (!response.ok) {
                throw new Error('CSV proxy response not ok for ' + csv_proxy_url);
            }
            return response.text();
        })
        .then(function(return_csv_data) {
            // Pass the full CSV text to Shiny.
            var csv_data = {
                data1: return_csv_data
            };
            Shiny.setInputValue('csv_data_in', csv_data);
        })
        .catch(err => {
            console.error(err);
            document.getElementById('upload_conf').innerHTML =
                '<span style=\"color:#BB0000; font-weight:bold;\">' + err + '</span>';
        });
  });

  // Fetch JSON data (data2 & data3) from BusRouter.
  Shiny.addCustomMessageHandler('fetch_busrouter', function(params) {
    document.getElementById('result_conf').innerHTML =
    '<span style=\"color:#40A0E0; font-weight:bold;\">Importing from BusRouter, please wait...</span>';
    var json_urls = [
      'https://data.busrouter.sg/v1/services.json',
      'https://data.busrouter.sg/v1/stops.json'
    ];
    return Promise.all(
      json_urls.map(function(url) {
        return fetch(url).then(function(response) {
          if (!response.ok) {
            throw new Error('Network response not ok for ' + url);
          }
          return response.json();
        });
      })
    ).then(function(return_json_data) {
      var json_data = {
        data2: return_json_data[0],
        data3: return_json_data[1]
      };
      Shiny.setInputValue('json_data_in', JSON.stringify(json_data));
      //document.getElementById('result_conf').innerHTML =
        //'<span style=\"color:#00DD00; font-weight:bold;\">File import successful!</span>';
    });
  });

  // Clear cache upon refresh
  window.onbeforeunload = function() {
    // Clear session storage
    sessionStorage.clear();
    // Clear local storage (or specific cache keys)
    localStorage.clear();
    // Clear caches created via the Cache API
    if ('caches' in window) {
      caches.keys().then(function(names) {
        names.forEach(function(name) {
          caches.delete(name);
        });
      });
    }
  };
})