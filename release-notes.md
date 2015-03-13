
========================================================
  Release Notes - SafeFrames Reference Implementation
========================================================

These release notes will track all code increments and packaged versions.
Please note: starting with 1.1.1 the revision number (third number) 
will denote a bug fix increment. Odd numbered revisions are non-packaged
and in flux, so cannot be considered reliable when version sniffing.
Even revision numbers (0, 2, 4, etc.) are packaged and version-stable. 

Official project home
https://github.com/InteractiveAdvertisingBureau/safeframe

Mirror
http://sourceforge.net/p/safeframes/

Links, tools, and examples
http://safeframes.net/

IAB SafeFrame overview
http://www.iab.net/safeframe


Version 1.1.2
==============

Bug fixes - Not, switching to Github for tracking as of this version.
-----------
* Metadata object fix - section 4.6 of spec allows any key/value object passed to Position, 
  but implementation only recognized a PosMeta object instance (ticket #2).
* Commented out CSS transition in example (ticket #1).
* Code fails building geom with 3D overlap (ticket #3).


Version 1.1.1
==============

Bug fixes
-----------
* Flash version check (flash_ver) returning null (ticket #16)
* Variables leaking into global namespace (ticket #15)
* Meta object fails to record values if private meta object is not defined (ticket #13)
* $sf.ext.message does not receive a response, causing subsequent calls to fail (ticket #8)



___

Version 1.1.0
==============
**Package date: 10/7/2014**

New Features
--------------

Version 1.1 matches spec version 1.1 and adds this functionality:

* $sf.ext.winHasFocus() method added. This method will return a boolean value to the 
  external (ad-side) caller that tells if the browser window currently has focus.
  This is designed to be used in conjunction with viewability information.
  
* $sf.specVersion property added. This property tells which specification version the
  implementation is written against. It is additive to $sf.ver which tells the 
  code implementation version.
  

Bug Fixes
--------------

* $sf.ext.status error on initial state (ticket #2)
* Firefox compatibility issues on Node.insertBefore (ticket #12)
* IE 11 compatibility issues to fix failed render (ticket #7)
* Variables leaking into the global namespace (ticket #15)









=======================================
LICENCE
=======================================
Copyright (c) 2012, Interactive Advertising Bureau
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions 
are met:

Redistributions of source code must retain the above copyright notice, 
this list of conditions and the following disclaimer. Redistributions 
in binary form must reproduce the above copyright notice, this list 
of conditions and the following disclaimer in the documentation 
and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT 
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS 
FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE 
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, 
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER 
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN 
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.



