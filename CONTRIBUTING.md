# Digital Roadmap

First off, thanks for taking the time to contribute!

## Getting started

### Initial etc/hosts setup

In order to access the https://[env].foo.redhat.com in your browser, you have to add entries to your `/etc/hosts` file. This is a **one-time** setup that has to be done only once (unless you modify hosts) on each devel machine.

Best way is to edit manually `/etc/hosts` on your localhost line:

```
127.0.0.1 <your-fqdn> localhost prod.foo.redhat.com stage.foo.redhat.com
```

Alternatively you can do this by running following command:
```bash
npm run patch:hosts
```

If this command throws an error run it as a `sudo`:
```bash
sudo npm run patch:hosts
```

1. [This repo] etc/hosts setup is required to access the application in the browser.
2. Clone `chrome-service-backend` and checkout [this branch](https://github.com/andywaltlova/chrome-service-backend/tree/feat/digital-roadmap-nav)
   * the changes on that branch are required to see the application in navigation menu
   * run `make dev-static` to start the service
3. [This repo] ```npm install```
4. [This repo] ```npm run start```
   * set the environment variable `CHROME_SERVICE` to the port that it is listening on (by default `8000`). For example, `CHROME_SERVICE=8000 npm run start`.
5. [This repo] Select environment to run the app in, for dev you can use e.g. `stage-stable`, url for that would be `https://stage.foo.redhat.com:1337/insights/digital-roadmap`
6. [This repo] Open browser in URL listed in the terminal output
   * If you see cert error continue to the page anyway (this is expected), I had no problem with firefox but chrome may be more strict
   * For the credentials you can check our shared password manager, if you don't have required rights at your own account

### Testing

`npm run verify` will run `npm run lint` (eslint) and `npm test` (Jest)
