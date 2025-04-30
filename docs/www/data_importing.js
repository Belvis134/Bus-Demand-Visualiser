document.addEventListener('DOMContentLoaded', function() {
  // Fetch Datamall data via Netlify
  Shiny.addCustomMessageHandler('fetch_datamall', function(params) {
    document.getElementById('upload_conf').innerHTML =
        '<span style=\"color:#2050C0; font-weight:bold;\"><i class=\"fas fa-hourglass-half\"></i> Importing from Datamall, please wait...</span>';
    const encoded_account_key = encodeURIComponent(params.account_key);
    const csv_proxy_url = 'https://brdv.netlify.app/.netlify/functions/datamall_proxy' +
        '?date=' + params.date +
        '&account_key=' + encoded_account_key;
    fetch(csv_proxy_url)
        .then(response => {
            return response.text();
        })
        .then(function(return_csv_data) {
          // Check for an empty (or null) response.
          if (!return_csv_data || return_csv_data.trim() === "") {
            throw new Error("Bad response. Is your account key valid?");
          }
          // Try parsing the response as JSON to see if there's a fault, which means you reached rate limit.
          let parsed_response;
          try {
            parsed_response = JSON.parse(return_csv_data);
          } catch(e) {
            parsed_response = null;
          }
          if (parsed_response && parsed_response.fault) {
            throw new Error('You have reached the rate limit. Try again after a while.');
          }
          // Pass the full CSV text to Shiny.
          var csv_data = {
            data1: return_csv_data
          };
          Shiny.setInputValue('csv_data_in', csv_data); 
          document.getElementById('result_conf').innerHTML =
            '<span style=\"color:#00DD00; font-weight:bold;\"><i class=\"fas fa-square-check\"></i> File import successful!</span>';
        })
        .catch(err => {
            console.error(err);
            let final_error_msg = err.message;
            if (!navigator.onLine) {
              final_error_msg = "Your internet is dead. Good job.";
            } else if (err.message.includes("Failed to fetch")) {
              final_error_msg = "Stuff can't connect, Your internet good man?";
            }   
            document.getElementById('upload_conf').innerHTML =
              '<span style=\"color:#BB0000; font-weight:bold;\"><i class=\"fas fa-triangle-exclamation\"></i> ' + final_error_msg + '</span>';
        });
  });

  // Fetch JSON data (data2 & data3) from BusRouter.
  Shiny.addCustomMessageHandler('fetch_busrouter', function(params) {
    document.getElementById('result_conf').innerHTML =
    '<span style=\"color:#2050C0; font-weight:bold;\"><i class=\"fas fa-hourglass-half\"></i> Importing from BusRouter, please wait...</span>';
    var json_urls = [
      'https://data.busrouter.sg/v1/services.json',
      'https://data.busrouter.sg/v1/stops.json'
    ];
    return Promise.all(
      json_urls.map(function(url) {
        return fetch(url).then(function(response) {
          if (!response.ok) {
            throw new Error('Your internet is dead. Good job.');
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
        //'<span style=\"color:#00DD00; font-weight:bold;\"><i class=\"fas fa-square-check\"></i> File import successful!</span>';
    })
    .catch(err => {
      console.error(err);
      document.getElementById('upload_conf').innerHTML =
          '<span style=\"color:#BB0000; font-weight:bold;\"><i class=\"fas fa-triangle-exclamation\"></i> ' + err + '</span>';
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

  // Auto-adjust iframe height.
  function send_height() {
    // Compute the document's height
    var height = document.documentElement.scrollHeight || document.body.scrollHeight;
    // Send the height to the parent window
    window.parent.postMessage({ iframe_height: height }, "*");
  }
  
  // Call it when loaded and possibly on resize/mutation if dynamic
  window.addEventListener("load", send_height);
  // Optionally update on resize or changes:
  window.addEventListener("resize", send_height);
})