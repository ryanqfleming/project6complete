Welcome to project 6 backend
If you are not running this project from github please skip to step 3

Web Secruity error:
If you are having an issue loggin in there could be an issue with your web security.
Cors policy blocks the hardcoded IP from live server
you can get around this issue by launching chrome with the target
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir="C:/Chrome dev session" --disable-web-security"

This problem won't be an issue when the front end is hosted on a secure server

Setup Guide:
1) create a file named ".env" with the code ACCESS_TOKEN_SECRET=
Put in your secure token after the =

2)inside the project file run npm install via the terminal

3)inside the project file run "node app" via the terminal

4)Run the front end

