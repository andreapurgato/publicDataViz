/*
      Create the firebase connector.
 */

var sessionConnector = new Firebase('https://networksession.firebaseio.com/');

/*
      Sesisons variables.
 */
var sessions = {};
var sessionLoaded = {};

var conflicts = {
      1: [4,5,6],
      2: [4,5,6],
      3: [4,5,6],
      4: [1,2,3],
      5: [1,2,3],
      6: [1,2,3]
}

/*
      Operation to perform when the page is ready.
 */
jQuery(document).ready(function($) {

      // Create the sessions list.
      getSessions();

      // Hide the dialog with form when the page is clicked.
      $('#content').click(function(){
            $('#newSession').fadeOut('slow', 'swing');
            $('#deleteSession').fadeOut('slow', 'swing');
            $('.menuToggle').css('cursor','pointer');
      });

      // Show the loaded session details.
      $('#sessionLoaded').mouseenter(function(){

            if(Object.keys(sessionLoaded).length == 0){
                  return;
            }

            str = "<b><h2>Active Sessions</h2></b>";
            c = 0;
            for(k in sessionLoaded){
                  str = str + '<div class=\"sessionLoadedItem\">' +
                      '<b><font color=\"' + color[c] + '\">Session ' + k + '</font></b><br>' +
                      'Session Name: ' + sessions[k]['sessionName'] + '<br>' +
                      'Nonde number: ' + sessions[k]['nodeNumber'] + '<br>' +
                      'Window Size: ' + sessions[k]['timeWindow'] + '<br>' +
                      'Data Folder: ' + sessions[k]['folder'] + '<br>' +
                      'Owner: ' + sessions[k]['creator'] + '</div>';
                  c++;
            }

            // Hide and show
            $('#sessionLoaded').hide(0, function(){

                  $('#sessionLoadedBig').html(str);
                  $('#sessionLoadedBig').show(200);

            });

      });

      $('#sessionLoadedBig').mouseleave(function(){

            if(Object.keys(sessionLoaded).length == 0){
                  return;
            }

            $('#sessionLoadedBig').hide(200, function() {
                  $('#sessionLoaded').show(0);
                  $('#sessionLoadedBig').html("");
            });
      });

});

function showNewSession(){
      $('#newSession').fadeIn('slow', 'swing');
}

function showDeleteSession(){
      $('#deleteSession').fadeIn('slow', 'swing');
}

/*
      Get the existing session.
 */

function getSessions(){

      sessionConnector.on('value', function(dataSnapshot) {

            // Empty the div with the sessions
            $("#sessionList").html("");

            // Empty the session variable.
            sessions = {};

            // Select the div where append the sessions.
            sessionList = $('#sessionList');
            deleteSessionList = $('#deleteSessionList');
            deleteSessionList.html("");

            var counter = 1;
            dataSnapshot.forEach(function(data){

                  sessions[counter] = data.val();
                  sessions[counter]['key'] = data.key();

                  // Append the session.
                  sessionList.append('<div class=\"menuToggleSession\" onclick=\"loadSession(' + counter + ');\"> ' + sessions[counter]['sessionName'] + '</div>');
                  deleteSessionList.append('<option value=\"' + sessions[counter]['sessionName'] +'\">' + sessions[counter]['sessionName'] + '</option>');
                  $('.menuToggleSession').css('cursor','pointer');

                  counter++;

            });

      });

}

/*
      Create new session.
 */

// Function that create the session.
function createSession(){

      var sessionName = document.getElementById('sessionName').value;
      var userName = document.getElementById('username').value;
      var timeWindow = document.getElementById('timeWindow').value;
      var nodeNumber = document.getElementById('nodeNumber').value;
      var dataFolder = document.getElementById('dataFolder').value;

      console.log(sessionName == '')

      if(sessionName == '' || userName == '' || timeWindow == '' || nodeNumber == '' || dataFolder == ''){

            $('#newSession').fadeOut('slow', 'swing');
            showMessage("Missed a Field.", function(){
                  $('#newSession').fadeIn('slow', 'swing');
            });
            return;
      }


      // Push the values of the session on line.
      sessionConnector.push({'sessionName': sessionName, 'creator': userName, 'timeWindow': timeWindow, 'nodeNumber': nodeNumber, 'folder': dataFolder});

      // Hide the dialog with form.
      $('#newSession').fadeOut('slow', 'swing');

      showMessage("Session created.", function(){
            document.getElementById('sessionName').value = null;
            document.getElementById('username').value = null;
            ddocument.getElementById('timeWindow').value = null;
            document.getElementById('nodeNumber').value = null;
            document.getElementById('dataFolder').value = null;
      });

}

/*
      Delete a session.
 */

// Function that create the session.
function deleteSession(){

      resetData();

      var sessionName = document.getElementById('deleteSessionList').value;

      if(sessionName != ''){

            // Find the key of the session to delete.
            var key = 0;
            for (var k in sessions) {
                  if(sessions[k]['sessionName'] == sessionName){
                        key = sessions[k]['key'];
                  }
            }

            // Delete the values of the session on line.
            sessionConnector.child(key).remove();

            // Hide the dialog with form.
            $('#deleteSession').fadeOut('slow', 'swing');

            showMessage("Session Deleted.", function(){});

      } else {

            $('#deleteSession').fadeOut('slow', 'swing');
            showMessage("Select a Session.", function(){
                  $('#deleteSession').fadeIn('slow', 'swing');
            });

      }

}

/*
      Function invoked when a session has to be loaded.
 */

function loadSession(s){

      var canLoad = true;
      for (var k in sessionLoaded){
            if (contains(conflicts[k], s)) {
                  canLoad = false;
            }
      }

      if (!canLoad) {

            showMessage("The sessions are incompatible, <br> different input data", function(){});

      } else {

            if(s in  sessionLoaded){

                  showMessage("Session already loaded", function(){});

            } else {

                  showMessage("Session Selected: " + sessions[s]['sessionName'], function(){
                        readInfo(sessions[s]);
                        sessionLoaded[s] = sessions[s]['key'];
                  });

            }

      }




}

function contains(a, obj) {
      for (var i = 0; i < a.length; i++) {
            if (a[i] === obj) {
                  return true;
            }
      }
      return false;
}
