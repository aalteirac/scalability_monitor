## Prerequisite
- Install load testing toolkit
  - Run `npm install -g artillery` (if you get an access error, I suggest not using `sudo` but instead changing ownership of the `/usr/local/lib/node_modules/` directory and all subdirectories like so: `chown -R <user> /usr/local/lib/node_modules/`. )

- Install the nodejs dependencies
  - Run `npm install` 

## Snowflake Demo Account Configuration

The application backend connects to a Snowflake instance when the server is started. For the application to properly make that connection, you must specify how to connect to your Snowflake demo account.
- Edit the `config.js` with your demo instance details

## View the widget

After the http server is running, you can access the website from your browser.
- Navigate to http://localhost:3000

