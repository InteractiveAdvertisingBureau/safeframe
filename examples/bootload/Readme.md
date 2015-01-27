
Bootload Example
================

This Bootload example demonstrates how to use a bootloader script to utilize SafeFrame. This is useful if you wish to deploy creatives that run inside SafeFrame to a publisher that does not necessarily have the framework configured. In this manner you can distribute a single script tag that handles everything for the publisher

Bootloader Execution Overview
-----------------------------

#### Stage 1 - Detect and load Framework

The script first detects to see if SafeFrame is present. If SafeFrame is detected (window.$sf) the loader moves on to stage 2. If SafeFrame is not present the script will inject the framework into the page DOM. When using this script you should **edit to set the SafeFrame framework location**.

#### Stage 2 - Create placement targets

The publisher page can pass in an ID of the target element and parameters that define its size. If the specified element(s) doesn't exist, it will be created at the location of the script.

#### Stage 3 - Configure Framework

If an existing SafeFrame framework was not detected, configure SafeFrame.

#### Stage 4 - Render placement(s)

Load ad(s) into the SafeFrame positions and render them.



