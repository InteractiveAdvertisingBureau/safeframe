REM ===============================================
REM Run this script once to configure your test environment
REM to run the karma system
REM ===============================================

REM Errors of type CERT_UNTRUSTED may be fixed by uncommenting the following line:
REM npm config set ca ""

npm install -g karma
npm install -g karma-jasmine
npm install -g karma-chrome-launcher
npm install -g karma-coverage

