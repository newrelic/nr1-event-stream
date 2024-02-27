[![New Relic One Catalog Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/New_Relic_One_Catalog_Project.png)](https://opensource.newrelic.com/oss-category/#new-relic-one-catalog-project)

# Event Stream

![CI](https://github.com/newrelic/nr1-event-stream/workflows/CI/badge.svg) ![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/newrelic/nr1-event-stream?include_prereleases&sort=semver) [![Snyk](https://snyk.io/test/github/newrelic/nr1-event-stream/badge.svg)](https://snyk.io/test/github/newrelic/nr1-event-stream)

## Usage

Event Stream is similar to Unix’s `tail` program, now focused on APM.

Event Stream uses data from `Transaction` and `TransactionError` events to display a live stream of processes occuring in your system.

![Screenshot](catalog/screenshots/nr1-event-stream-01.png)

## Dependencies

Requires [`New Relic APM`](https://newrelic.com/products/application-monitoring).

## Enabling this App

This App is available via the New Relic Catalog. 

To enable it in your account, go to `Add Data > Apps and Visualzations` and search for "Event Stream". Click the `Event Stream` card, and then click the `Add this App` button to add it to your account(s).

Once subscribed: 
1. navigate to a Services app via the Entity Explorer in New Relic
2. locate and click the `Event Stream` menu item in the secondary left-nav, found under `More Views` (note: on the first time accessing the app, you may be prompted to enable it)

#### Manual Deployment
If you need to customize the app, fork the codebase and follow the instructions on how to [Customize a Nerdpack](https://developer.newrelic.com/build-apps/customize-nerdpack). If you have a change you feel everyone can benefit from, please submit a PR!

## Support

<a href="https://github.com/newrelic?q=nrlabs-viz&amp;type=all&amp;language=&amp;sort="><img src="https://user-images.githubusercontent.com/1786630/214122263-7a5795f6-f4e3-4aa0-b3f5-2f27aff16098.png" height=50 /></a>

This project is actively maintained by the New Relic Labs team. Connect with us directly by [creating issues](../../issues) or [asking questions in the discussions section](../../discussions) of this repo.

We also encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

New Relic has open-sourced this project, which is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT.

## Security

As noted in our [security policy](https://github.com/newrelic/nr1-event-stream/security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.
If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource@newrelic.com.


## Open Source License

This project is distributed under the [Apache 2 license](LICENSE).
