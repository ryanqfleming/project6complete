Welcome to project 6 backend
If you are not running this project from github please skip to step 4

Web Secruity error:
Cors policy blocks localhost from live server
Windows:
you can get around this issue by launching chrome with the target
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir="C:/Chrome dev session" --disable-web-security"
Mac: 
Use saferi
Enable the develop menu by going to Preferences > Advanced.
Then select “Disable Cross-Origin Restrictions” from the develop menu.
Restart saferi when done and cors will be restored

it's important not to use a browser with websecurity disabled on untrusted websites

This problem won't be an issue when the front end is hosted on a secure server

Setup Guide:
1) create a file named ".env" with the code 
ACCESS_TOKEN_SECRET=
DATABASE=
Put in your secure token after the ACCESS_TOKEN_SECRET=
and the database password after DATABASE=
To get database password please reach out to me

2) create a folder in the root directy called "images"

3)inside the project file run npm install via the terminal

4)inside the project file run "node app" via the terminal

5)Run the front end

