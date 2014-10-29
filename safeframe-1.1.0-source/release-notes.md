=============
Release Notes - SafeFrame v 1.1.0
=============

These release notes cover SafeFrame reference implementation version 1.1.0.
Package date: 10/7/2014

Official project home
http://sourceforge.net/p/safeframes/

Links, tools, and examples
http://safeframes.net/

IAB SafeFrame overview
http://www.iab.net/safeframe


=============
New Features
=============

Version 1.1 matches spec version 1.1 and adds this functionality:

* $sf.ext.winHasFocus() method added. This method will return a boolean value to the 
  external (ad-side) caller that tells if the browser window currently has focus.
  This is designed to be used in conjunction with viewability information.
  
* $sf.specVersion property added. This property tells which specification version the
  implementation is written against. It is additive to $sf.ver which tells the 
  code implementation version.
  

=============
Bug Fixes
=============

* $sf.ext.status error on initial state (ticket #2)
* Firefox compatibility issues on Node.insertBefore (ticket #12)
* IE 11 compatibility issues to fix failed render (ticket #7)
* Variables leaking into the global namespace (ticket #15)



