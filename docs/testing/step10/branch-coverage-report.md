# Branch coverage report — step 10

Measured application branch coverage: **95.12%**, excluding test files.
Sanitizer, validators and sanitizer middleware each report **100%** in this run.

Covered branches include plain/non-string values; arrays, objects and depth limits;
allowed/forbidden keys; visible/invisible text; correct/invalid targets and length
boundaries. Raw details appear in `unit-and-coverage.txt`.

Node's runtime branch numbers can report 100% for modules containing uncalled
functions, so interpret branch results alongside line/function coverage. These
figures do not mean all application routes, client code or production failure
modes are covered. Live-system coverage is not merged into these totals.
