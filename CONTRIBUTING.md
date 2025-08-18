# Digital Roadmap

First off, thanks for taking the time to contribute!

## Getting started

### Prerequisites

[Go]

### Add entries to /etc/hosts

In order to access the` https://[env].foo.redhat.com` in your browser, you have to add entries to your `/etc/hosts` file. This is a **one time** setup that has to be done on each development machine.

Add the following to `/etc/hosts`:

```
127.0.0.1 prod.foo.redhat.com stage.foo.redhat.com qa.foo.redhat.com ci.foo.redhat.com
```

Alternatively you can do this by running following command:

```bash
npm run patch:hosts
```

If this command throws an error run it as a `sudo`:

```bash
sudo npm run patch:hosts
```

###

In the checkout of this repository, do the following:

1. Install dependencies.

   `npm install`

1. Start the application.

   `npm run start`

1. Select the environment when prompted, such as `stage`. The URL for that environment is `https://stage.foo.redhat.com:1337/insights/planning/roadmap`.

1. Open the URL listed in the terminal output in your browser.

   - If you see a certificate error, ignore the error and continue.
   - For the credentials you can check our shared password manager if you don't have required rights at your own account.

### Testing

`npm run verify` will run `npm run lint` (eslint) and `npm test` (Jest)

[go]: https://go.dev/doc/install
