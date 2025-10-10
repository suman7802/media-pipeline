## 1.5.0 - 2025-10-10

1. #### Updated build script
    - Changed `"build": "tsc --build && tsc-alias"` to `"build": "tsc && resolve-tspaths"`

2. #### Updated email sending logic
    - Switched from using template IDs to Handlebars local templates
    - Removed template IDs from environment files

3. #### Lint-staged optimization
    - Improved lint-staged commands for faster and more efficient pre-commit checks
    - Reduced unnecessary file scanning and formatting overhead

4. #### Updated translations
    - Updated `locales/en/translation.json`

5. #### Minor configuration updates
    - Tweaked project configs for better performance and maintainability
    - Updated some internal settings and environment defaults

## 1.4.0 - 2025-07-16

    > Added multer config
    > fix some minor bugs

## 1.3.0 - 2025-05-26

    > Updated import paths to use `@` alias for cleaner imports.

## 1.2.0 - 2025-04-09

1. #### Added metrics by Containerization
    > created `docker-compose` to run the project with Grafana and Prometheus for monitoring.

## 1.0.2 - 2025-03-17

1. #### Added metrics clnfiguration
    - Added `prom-client` to collect metrics
    - Added `/metrics` endpoint to expose metrics

2. #### Added `validateSchema` middleware
    - Added `validateSchema` middleware to validate request payload

3. #### Added `example metrics` route to test metrics

4. #### Fixed casing inconsist in `locales` folder

## 1.0.1 - 2025-03-15

1. #### Added Nodemailer to send emails

2. #### Added Postman documentation

    > [PostMan Documentation](https://documenter.getpostman.com/view/27265804/2sAYkBsM99)

3. #### Added examples API's
    - Send email
    - Slow Down
    - Api Key
    - Localization
    - File upload

## 1.0.0 - 2025-03-06

- Initial release
