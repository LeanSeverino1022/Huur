already removed the js code related to the halfdays...
you may remove the css that hides them too.





the basic flow

when user clicks calendar day - 


$('.wc-bookings-booking-form fieldset').on('date-selected',
which triggers ->  $('body').trigger('calendarDateWasClicked');

calendarDateWasClicked
 -> calls  bookingTabSteps.showPrimaryModal();
-> and saves userSelected date - (
-> then calls toggleCalendarAndTimeOptions - 
     -> this sets the date label
    -> shows the booking-time-options (currently now it's just whole day)


Now if the user clicks(changes) the booking-time-options(now it's just one option for whole day)
-> change event is triggered which is  $('.booking-time-options').on('change', () => {
	->which then calls  updateUserSelectedBookingTimes() // Update user selected booking times(start and end) only. Not yet the actual Form to be posted
	-> then switches to tab-4(shows cart items)
	
}

 	-updateUserSelectedBookingTimes 
		-> what this function does is  - We are just manually setting time programatically by setting the value of #wc-bookings-form-start-time(default elem by the plugin). When plugin time block settings change later on, we have to update code here


then ajaxSend 


if i can cleanup stuff what would it be?

change the booking-time-options to be just a button instead of on change thing
the time... get it from real data rather than hard-coding it... the 09-17:00 




questions: 

on updateUserSelectedBookingTimes, what happens if I set an invalied setSelectedStartTime and setSelectedEndTime, why doesn't it work.

