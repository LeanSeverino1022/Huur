## Update 02/23 4:40pm

🤔 what I did...

1. You can see the half-day booking now... removed some of the unnecessary and complicated code.

2. Bike description stuff - I updated the code that it's easy for you later on Edit it. Instead of matching the description with the resource id, I set it to match the resource name('M Elektrische mountainbike', 'L Mountainbike', etc. ) instead.

3. A lot testing why sometimes the resources(bikes) are incomplete...
 - some findings: 

	Here's video regarding resources not loading **test site** vs **actual site** : https://www.loom.com/share/134449c4792f40f0ac5d0ae88dccd279

     - it's a 503 Service Unavailable error. Based on the definition, this indicates that a server is temporarily unable to handle the request. This may be due to the server being overloaded or down for maintenance. ).
     - I tested it on "test website" and it doesn't fail to load all the resources there unlike in the "mountainbikehurenschoorl site". It's more on server-related stuff but I did some research and I there are things we could try  like the ones mentioned here:

	1 - https://kinsta.com/blog/http-error-503/  
	2 - https://blog.hubspot.com/marketing/http-503-server-unavailable

I did try the  Heartbeat Control plugin (mentioned in the kingsta article above) but I am not sure if that's the reason why I'm no longer finding the issue with incomplete resources.



**Here are my #nextThingsToDo**

 - However, even if the test website is NOT dealing with the 503 issue(which causes some of the resources not to load on the UI), I still find it slow, so I believe I should still try and find a way to make it faster and currently I'm trying to figure out what I can do on my end to achieve that.

 - The other one that I will work on next is try to update from hourly to daily booking(plugin settings and the code).








# Huur


- [x] Remove halfdays (09:00 - 13:00 & 13:00 - 17:00) in JS




