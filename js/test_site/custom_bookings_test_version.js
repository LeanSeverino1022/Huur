var $j = jQuery.noConflict();
window.debugOn = 0;

$j(document).ready(function () {
    if (window.debugOn) {
        $j('.wc_bookings_field_duration').attr('type', '')
        $j('#wc_bookings_field_start_date').attr('type', '')
        $j('.form-field-wide').css('display', 'block')
        $j('.wc-bookings-date-picker-date-fields').css('display', 'block')
    }
});

/**
 *  *||Config
 */
window.gMainUrl = 'https://wpbeter-ontwikkelt.nl';

const mySettings = {
    spinner: {
        blockUIOverlayCSS: {
            background: '#FFF',
            opacity: 0.7,
        }
    },
    productLabel: {
        mtb: 'Mountainbikes',
        electric: 'Elektrische mountainbikes'
    },

    // take note of https://mountainbikehurenschoorl.nl/wp-json/wc-bookings/v1/
    bikeDescription: {
        'XL Elektrische mountainbike': `<span>Framemaat: 21 inch <br>
                            Lichaamslengte: 1,87 - 1,96 m</span>`,

        'L Elektrische mountainbike': `<span>Framemaat: 19 inch <br>
                            Lichaamslengte: 1,77 - 1,90 m</span>`,

        'M Elektrische mountainbike': `<span>Framemaat: 17 inch <br>
                            Lichaamslengte: 1,67 - 1,83 m</span>`,

        'S Elektrische mountainbike': `<span>Framemaat: 15 inch <br>
                            Lichaamslengte: 1,57 - 1,73 m</span>`,

        'XXL Mountainbike': `<span>Framemaat: 23 inch <br>
                            Lichaamslengte: 1,92 m en langer</span>`,

        'XL Mountainbike': `<span>Framemaat: 21 inch <br>
                            Lichaamslengte: 1,87 - 1,96 m</span>`,

        'L Mountainbike': `<span>Framemaat: 19 inch <br>
                            Lichaamslengte: 1,77 - 1,90 m</span>`,

        'M Mountainbike': `<span>Framemaat: 17 inch <br>
                            Lichaamslengte: 1,67 - 1,83 m</span>`,

        'S Mountainbike': `<span>Framemaat: 15 inch <br>
                            Lichaamslengte: 1,57 - 1,73 m</span>`,
    },

    errorMsg: {
        reloadPage: `<b>We kunnen geen verbinding maken met de server.</b><br>Controleer je internetverbinding en laad de pagina opnieuw.`,
        reloadPageBtnTxt: 'Probeer opnieuw',
        tryAgain: '<b>Verbindingsfout.</b><br>Controleer je internetverbinding en probeer het opnieuw.',
        retryBtnTxt: 'Probeer opnieuw',
        reserveAgain: '<b>Je reservering is nog niet verwerkt vanwege een verbindingsfout.</b><br>Controleer je internetverbinding en probeer het opnieuw.',
        reserveAgainBtn: 'Probeer opnieuw',
    }

};

/**
 * * ||GLobal AJAX Event Handlers
 *  handle events that happens on any Ajax requests
 */

$j(document).ajaxSuccess(function (event, xhr, settings) {

    //on when plugin knows what dates are booked
    if (typeof settings.url === 'string' &&
        settings.url?.includes('wc_bookings_find_booked_day_blocks')) {
    }

    // HANDLE SUCCESSFUL BOOKING CALCULATE COSTS RESPONSE MESSAGES
    else if (
        typeof settings.data === "string" &&
        settings.data.includes("action=wc_bookings_calculate_costs")
    ) {

        if (getBlocksRequest.getInitiator() == getBlocksRequest.Triggers.RESOURCE_CHANGE) {
           //when you change resources, the date resets so we need to set it again.
            $j('body').trigger('afterResourceChangeSetDateAgain');
            getBlocksRequest.resetInitiator();

            blocker.unblockContentTemp('resource id change triggered');
            return; //return to prevent afterCalculateCostRequest since we need to reset date
        } else if (getBlocksRequest.getInitiator() == getBlocksRequest.Triggers.QUANTITY_CHANGE) {
            getBlocksRequest.resetInitiator();

            blocker.unblockContentTemp('quantity change triggered');
        }

        //console.log("success wc_bookings_calculate_costs");
        $j('body').trigger('afterCalculateCostRequest', [xhr.responseText]);
    }
});

$j(document).ajaxError(function (event, jqxhr, settings, thrownError) {

    // On change calendar month or year
    let findBookedDayBlocksRequest = typeof settings.url == 'string' &&
        settings.url.includes('wc_bookings_find_booked_day_blocks');

    let calculateBookingCostRequest = typeof settings.data === "string" &&
        settings.data.includes("action=wc_bookings_calculate_costs");

    let checkoutAttempt = settings.type == "POST" && (typeof settings.data === 'string' && settings.url.includes("wc-ajax=checkout"));

    let deleteOrderAttempt = typeof settings.data === 'string' &&
        settings.data.includes('action=pp_remove_from_cart');

    if (findBookedDayBlocksRequest) {
        blocker.unblockCalendar();
        dataService.notifyConnectionErrorRetry(jqxhr, jqxhr.statusText);
    }

    else if (calculateBookingCostRequest) {
        dataService.notifyConnectionErrorRetry(jqxhr, jqxhr.statusText);
        blocker.unblockContentTemp('filling up booking form');
    }

    else if (checkoutAttempt) {
        dataService.notifyConnectionErrorOnCheckoutAttempt(jqxhr, jqxhr.statusText);
        // Remove this because it's showing the woocommerce-error container but with no error msg
        $j('.woocommerce-NoticeGroup-checkout').html('');
    }

    else if (deleteOrderAttempt) {
        alert("Connection Error. Check your internet connection and try again.");
        blocker.unblockContentTemp('add remove product');
    }
});

/**
 *  *||SECTION: Custom event handlers triggered by other external scripts( woocommerce, one-page-checkout, etc.) not created by wpBeter
*/

// Custom event for devs to hook into before posting of products for processing- one-page-checkout-js
$j('body').on('opc_add_remove_product', function (event, data) {
    blocker.blockContentTemp('add remove product');
});

// Fired in one-page-checkout-js
// Custom event for devs to hook into AFTER products HAVE BEEN processed - from opc
$j('body').on('after_opc_add_remove_product', function (event, data, response) {
    blocker.unblockContentTemp('add remove product');

    if (response.result !== 'success') {
        // Todo: if unsuccessful just proceed to cart page, scroll to opc-messages. let the opc handle it. return early
        console.error(response.messages)
    }

    if (data.action == 'pp_add_to_cart') {
        $j('.tabs-nav a[href="#tab-5"]').trigger('switchActiveTab');

        const addedItem = gCartItemToUpdateDisplayPrice.closest('.item').find('.resource-name').text();
        bookingTabSteps.setAddedOrRemovedItemResourceName(addedItem);

    }
    else if (data.action == 'pp_remove_from_cart') {
        if (data.update_key) {
            const removedItem = $j(`.cart_item.opc_cart_item[data-update_key=${data.update_key}]`).find('dd.variation-Fiets').text();
            bookingTabSteps.setAddedOrRemovedItemResourceName(removedItem);
        }
    }

    // Scroll top to highlight OPC message
    document.getElementById("tab-5").scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });

});

// Event triggered in date-picker.js on after calendar day click only
// wc_bookings_get_blocks ajaxsuccess is triggered on different occasions
$j('.wc-bookings-booking-form fieldset').on('date-selected', function (e, date, start_or_end_date) {
    $j('body').trigger('calendarDateWasClicked');
    getBlocksRequest.setInitiator(getBlocksRequest.Triggers.DATE_SELECT);
});

// Override default woocommerece auto scroll to check-out-error message with our own scroll that works in our case.
jQuery(document.body).on('checkout_error', function () {
    // Stops the auto scroll to checkout error in woocommerce. see woocommerce.min.js.formatted i.scroll_to_notices
    jQuery('html, body').stop();
    // Then apply our own scroll to checkout error
    document.getElementById("tab-5").scroll({
        top: $j('#opc-messages').outerHeight() - 10,
        behavior: 'smooth'
    });
});

//END OF SECTION: Custom event handlers triggered on other scripts


const TIME_FORMAT = 'HH:mm';

// Globals
window.gFormCart = $j('form.cart');
window.gFormCheckout = $j('form[name=checkout]');

// The actual form input elements used to process bookings. take note its an id
window.gPostDataNumPersons = $j('input[name="wc_bookings_field_persons"]');
window.gPostDataResource = $j('select[name="wc_bookings_field_resource"]');

window.gCartItemToUpdateDisplayPrice = null;
function updateCartItemToUpdateDisplayPrice($el) {
    gCartItemToUpdateDisplayPrice = $el.find('.total-price');
}

function updateFormResource(new_value) {
    gPostDataResource.val(new_value).change();

    // Proceed to ajaxSuccess / ajaxError and find wc_bookings_get_blocks to trace next action
    getBlocksRequest.setInitiator(getBlocksRequest.Triggers.RESOURCE_CHANGE);
}


let gResourceIds = []; // Format is { product[productid]: [array of resource ids]   }
let gResourcesData = [];

let gCustomSlotsData = new Array(); // To contain slots available based on user selected date

/**
 *  *||manipulate DOM
 *  Manipulate the DOM to customize user experience. Stuff here can also be done in the theme files later
 */
const manipulateDom = (function () {

    const start = function () {
        createAndInsertHtmlOnPageLoad();
        hideElementsForever();
        hideElementsOnInit();
    };

    // Create and insert HTML on page load
    const createAndInsertHtmlOnPageLoad = function () {

        let htmlTabsNav = `
        <div class='booking-popup-header'>Mountainbike Huren Schoorl</div>
        <ul class="tabs-nav" style="display:none">
            <li class="js-tab-active"><a href="#tab-1" rel="nofollow">Datum & Tijd</a>
            </li>
            <li><a href="#tab-4" rel="nofollow">Kies maat</a>
            </li>
            <li><a href="#tab-5" rel="nofollow">Reserveer</a>
            </li>
        </ul>`;

        const prevBtn = `<span class="prev-btn"></span>`;

        // 2. Create the tab contents
        const tab1Content = `
        <div id='tab-1' class='tab-step'></div>`;

        const tab4Content = `
        <div id="tab-4" class="tab-step">
            <div class="shopping-cart-container">
                <div class="booking-steps-overview-wrapper">
                    <p class="start-date-label go-to-choose-date"><span class="selected-time"></span></p>
                    <p class="shopping-cart-time-text"><span class="pickup-time"></span> - <span class="return-time"> </span></p>
                </div>
                <ul class="bikes-accordion">
                    <li>
                        <div class="bikes-accordion-header">
                            <div class="booking-steps-title-wrapper">
                                <p>Kies mountainbikes</p>
                            </div>
                        </div>
                        <div class="bikes-accordion-content">
                        </div>
                    </li>
                </ul>
            </div>
        </div>`;

        const tab5Content = `<div id='tab-5' class='tab-step'></div>`;

        const htmlDateLabel = `
            <div class="booking-steps-title-wrapper">
                <p>Kies tijd</p>
            </div>
            <div class="selected-date-label"></div>`;

        // Generice messages
        const genericModal = `<div class="generic-modal text-center" style="display: none"></div>`;

        $j('fieldset.wc-bookings-date-picker').prepend(htmlDateLabel); //step/tab 1

        // We add the TABS NAV in the DOM
        $j('form.cart').prepend(htmlTabsNav);
        $j('form.cart').prepend(prevBtn);

        $j('#wc-bookings-booking-form').addClass('tabs-stage');

        // Didnt' include tab 5 in bokings-form because this form is used by the plugin. it mess up stuff
        $j('#wc-bookings-booking-form').after(tab5Content); //step/tab 5

        $j('#wc-bookings-booking-form').prepend(tab4Content); //step/tab 4
        // $j('#wc-bookings-booking-form').prepend(tab2Content); //step 2
        $j('#wc-bookings-booking-form').prepend(tab1Content); //step 1

        $j('#wc-bookings-booking-form').append('<div class="tab-footers"></div');
        $j('.tab-footer')
            .append($j('.wc-bookings-booking-cost'))
            .append($j('.single_add_to_cart_button'));

        // ADD CONTENT TO TAB SECTIONS
        $j('.block-picker.wc-bookings-time-block-picker')
            .parents('.form-field')
            .eq(0) // On debugOn comment
            .prependTo('#tab-1') //on debugOn comment
            .hide(); // On debugOn comment

        $j('.wc-bookings-date-picker').prependTo('#tab-1');

        // Change order of checkout form HTML elements
        gFormCheckout.append(gFormCheckout.find($j('#customer_details')), gFormCheckout.find($j('#payment')));
        $j('#tab-5').append($j('#opc-messages'), gFormCheckout);
        // Add book again buttons
        $j('<button class="btn-top-book-more">Meer fietsen reserveren</button>').insertAfter($j('#order_review_heading'))
        $j('<button class="btn-bottom-book-more">Meer fietsen reserveren</button>').insertAfter($j('#order_review'));

        $j('body').append(genericModal);
    };

    const hideElementsForever = function () {
        if (window.debugOn) return;
        // Hide forever
        $j('.wc_bookings_field_persons').hide(); /* Hide num of persons form-field */
        $j('.wc_bookings_field_resource').hide(); /* Hide select bike form-field*/
        $j('.wc-bookings-time-block-picker').hide(); /* Start and end time inputs container*/
        $j('.wc-bookings-date-picker .booking-steps-title-wrapper').hide();
        $j('.wc_bookings_field_duration').hide();
    };

    const hideElementsOnInit = function () {

        // When modal-primary is closed which is the case on page init, hide these elements
        $j('.booking-popup-header').hide();
        $j('.tab-step').hide(); // Hide all tab-steps by default
        $j('.single_add_to_cart_button').hide();

    };

    return {
        start,
    };

})();
/* END manipulate DOM */

/**
 *  *||BookingTabSteps - main module
 */
const bookingTabSteps = (function () {

    let userSelect = {
        date: {
            day: null,
            month: null,
            year: null
        }
    }

    // Keep track of the item added or removed to update opc-message
    let addedOrRemovedItemResourceName = null;

    const init = function () {
        initTabNavigation();
        registerEventHandlers();

        $j('.tabs-nav a:first').trigger('switchActiveTab'); // Show the 1st tab by default
    };

    const initTabNavigation = function () {

        // Register Tab Navigation Event Handlers
        $j('.tabs-nav a').on('switchActiveTab', function (event) {

            event.preventDefault();
            // Change nav tabs UI
            $j('.js-tab-active').removeClass('js-tab-active');
            $j(this).parent().addClass('js-tab-active');

            // $j('.tabs-stage .tab-step').hide();
            $j('.tab-step').hide(); // since we moved cart form for a bit... its no longer under tabs-stage
            $j($j(this).attr('href')).show();

            // #tab-* - destination tab...
            switch (event.currentTarget.getAttribute('href')) {
                case '#tab-1':

                    $j('#tab-1 .selected-date-label').text(uiText.displayDate());
                    resetShoppingCartFormTimesAndResource();
                    removeCalendarBlockedDates();

                    break;
                case '#tab-4':
                    uiText.updateShoppingCartBookingInfo();
                    $j('.bikes-accordion-content').empty();
                    renderShoppingCartItems();
                    resetShoppingCartFormTimesAndResource();
                    break;
                case '#tab-5':
                    resetShoppingCartFormTimesAndResource();

                    break;
                default:
                    break;
            }

            // Do this for all tab switch events
            updatePrevBtnVisibility();

        });

        $j('.prev-btn').on('click', function () {
            var activeTab = $j('.tabs-nav .js-tab-active');

            // ActiveTab on before tab switch
            switch (activeTab.children('a').attr('href')) {

                case '#tab-4':
                    $j('.tabs-nav a[href="#tab-1"]').trigger('switchActiveTab');
                    break;
                case '#tab-5':
                    // $j('.bikes-accordion-content').empty();
                    $j('.tabs-nav a[href="#tab-4"]').trigger('switchActiveTab');


                    $j('.bikes-accordion input[name="qty"]').val(0);
                    $j('.add-bike-to-cart').toggleClass('disabled', true);
                    $j('.total-price').text("");

                    break;
                default:
                    console.warn('review activeTab');
                    break;
            }
        });
    };

    const registerEventHandlers = function () {

        // MutationObserver for listening/detecting changes in the DOM
        const target = $j('.woocommerce-checkout-review-order .opc_order_review')[0];
        new MutationObserver(function (mutations) {
            $j('body').trigger('afterCartOrdersUiChanged');
        }).observe(target, {
            childList: true,
        });

        /* Currently triggered on when user adds/deducts items*/
        $j('body').on('singleCartItemFocused', function (e) {

            // If user is still active / still waiting for debounced startFillBookingForm event to trigger
            if (isWaitingForDebounce()) {
                return;
            }

            // While waiting for debounce func to execute
            notifyStartDebounceWait();

            blockBikeItemControls();
            resetUnfocusedBikesQuantity();
            resetAllBikesPriceUi();
        });

        $j('body').on('startFillBookingForm', debounce(function (e, quantity, resource_id) {

            // Notify that debounced startFillBookingForm event already triggered
            notifyEndDebounceWait();

            $j('.item').find('.add-bike-to-cart').toggleClass("disabled", true);

            unblockBikeItemControls();

            var triggerChangeEvt = null;
            //If quantity is the only thing that changed... then just update quantity amt and trigger change()
            if (onlyQuantityWasUpdated(quantity, resource_id)) {
                updateFormBikeQuantity(quantity, triggerChangeEvt = true);
                blocker.blockContentTemp('quantity change triggered');
            } else {
                updateFormBikeQuantity(quantity, triggerChangeEvt = false);
                updateFormResource(resource_id);
                blocker.blockContentTemp('resource id change triggered');
            }

        }, 1000));

        // CUSTOM EVENTS
        $j('body').on('calendarDateWasClicked', function (event, data) {

            bookingTabSteps.showPrimaryModal();

            // Save locally user selected date
            userSelect.date.year = $j("[name=wc_bookings_field_start_date_year]").val();
            userSelect.date.month = $j("[name=wc_bookings_field_start_date_month]").val();
            userSelect.date.day = $j("[name=wc_bookings_field_start_date_day]").val();

            $j('.tabs-nav a[href="#tab-4"]').trigger('switchActiveTab');
        });

        $j('body').on('afterResourceChangeSetDateAgain', function (event) {
            // On resource change, there are cases that the date resets. What we do here is set the date again using our saved user-selected date(see custom event calendarDateWasClicked)
            if (!$j("[name=wc_bookings_field_start_date_year]").val()) {

                if (!userSelect.date.year || !userSelect.date.month || !userSelect.date.day) {
                    console.error('missing year || month || day');
                    return;
                }

                $j("[name=wc_bookings_field_start_date_year]").val(userSelect.date.year);
                $j("[name=wc_bookings_field_start_date_month]").val(userSelect.date.month);
                $j("[name=wc_bookings_field_start_date_day]").val(userSelect.date.day).change();
            }
        });

        $j('body').on('afterCalculateCostRequest', function (event, responseText) {

            // HANDLE SUCCESSFUL BOOKING CALCULATE COSTS RESPONSE MESSAGES
            const response = $j.parseJSON(responseText);

            if (response.result == "SUCCESS") {
                // If success the returned html returns an el with class .woocommerce-Price-amount.amount
                // https://ourcodeworld.com/articles/read/376/how-to-strip-html-from-a-string-extract-only-text-content-in-javascript
                if ($j('.wc-bookings-booking-cost .woocommerce-Price-amount.amount').length && gCartItemToUpdateDisplayPrice) {
                    var copiedAmtTxt = $j('.wc-bookings-booking-cost .woocommerce-Price-amount.amount').html().replace(/<[^>]+>/g, '');
                    gCartItemToUpdateDisplayPrice.text(copiedAmtTxt);
                    console.log("displaying price: " + copiedAmtTxt)
                    bookingTabSteps.toggleAddToCartBtn();
                }

            } else if (response.result == "ERROR") {
               //hulpmiddel - resource
                const substrings = ['minumum aantal personen','minimum','Date is required','Datum','resource','hulpmiddel'];

                if(substrings.some(s => response.html.includes(s))) {
                    return;
                }

                //if error is related to booking more than available, refresh shown qty
                if(response.html.includes("beschikbaar") || response.html.includes("available")) {
                    $j('.tabs-nav a[href="#tab-4"]').trigger('switchActiveTab');
                }

                $j('.generic-modal').html(response.html);

                $j('.generic-modal').modal({
                    closeExisting: false,
                    escapeClose: true,
                    showClose: true,
                    clickClose: true
                });
            }

        });

        // On after review orders UI / fragments have been updated
        $j('body').on('afterCartOrdersUiChanged', function (event) {

            bookingTabSteps.updateCheckoutItems();
            // Changes in review orders also means opc messages have been updated so I also put the function to update the opc message(on add/delete item) here
            uiText.updateOpcMessageToShowResourceName();
        });

        // End CUSTOM EVENTS

        // Sales page buttons
        $j('.open-booking-popup').on('click', function () {
            bookingTabSteps.showPrimaryModal();
        });

        $j('.go-to-choose-date').on('click', function () {
            $j('.tabs-nav a[href="#tab-1"]').trigger('switchActiveTab');
        });

        $j('.btn-top-book-more, .btn-bottom-book-more').on('click', function (e) {
            e.preventDefault();
            $j('.tabs-nav a[href="#tab-4"]').trigger('switchActiveTab');
        });

        $j('.generic-modal').on('click', '.js-reload-page-btn', function (e) {
            location.reload();
        });

        $j('.generic-modal').on('click', '.js-restart-booking-btn', function (e) {
            bookingTabSteps.resetBookingProcess();
        });

        $j('.generic-modal').on('click', '.js-close-modal', function (e) {
            $j.modal.close();
        });

        // STEP/TAB 3 event handlers contained inside
        runBikeCartScripts();
    };

    const showPrimaryModal = function () {

        let modalIsAlreadyShowing = $j.modal.getCurrent() && $j.modal.getCurrent().$elm.is(gFormCart);

        if (modalIsAlreadyShowing) {
            return;
        }
        // We add the modal-primary class. note: always include the "modal" class.
        gFormCart.modal({
            modalClass: "modal modal-primary",
        });
    };

    // @params el = element current target on shopping cart click event
    const toggleAddToCartBtn = function () {
        const qty = parseInt(gCartItemToUpdateDisplayPrice.closest('.item').find('[name="qty"]').val());
        gCartItemToUpdateDisplayPrice.closest('.item').find('.add-bike-to-cart').toggleClass("disabled", qty < 1);
    }

    const updateCheckoutItems = function () {

        // Remove the default productname and replace with variation-Fiets
        $j('.opc_cart_item .product-details').each((idx, el) => {
            // Replace the top most text with the bike type
            $j(el).contents()[0].textContent = $j(el).find('.variation-Fiets > p').text();
            $j(el).find('.variation-Aantal').insertBefore($j(el).find('dt.variation-Huurdatum'));
            $j(el).find('.variation-Fiets').css('opacity', 0);

            // All code below to compute for rendered return time
            var dropoffTime = '';

            // Modify the order review of time row.. from show starting time to show pickup and return time

            // Use the duration to determine end time
            let durationInt = parseInt($j(el).find('dd.variation-Duur').text());

            // We are just getting the text from the original order review items.. and using it to create our own display data
            const orderPickupTime = $j(el).find('dd.variation-Huurtijd').text();
            let orderPickupDate = $j(el).find('dd.variation-Huurdatum').text();
            orderPickupDate = convertDutchTranslatedDateToEnglish(orderPickupDate);

            const computedActualDropoffTime = moment(orderPickupTime, "HH:mm").add(durationInt, 'h').format("HH:mm");

            // Used contains because Tycho might change some parts of the text later on
            const returnTimeIsSecondHalf = computedActualDropoffTime.includes('17'); //is it 5pm?

            if (returnTimeIsSecondHalf) {
                // If return time is 5:00 pm
                dropoffTime = uiText.fullDayReturnTime(orderPickupDate);
            } else {
                // If 1pm,just get actual return time

                dropoffTime = computedActualDropoffTime;
            }

            // Render the pickup and dropoff time
            $j(el).find('dd.variation-Huurtijd > p').text(`${orderPickupTime} - ${dropoffTime}`);

        });

    };

    // Convert because translated texts created by Tycho cannot returns invalid date on moment(date)
    const convertDutchTranslatedDateToEnglish = function (dateString) {

        let newDate = moment(dateString);
        if (newDate.isValid()) {
            return newDate;
        }

        const translate = {
            januari: 'january',
            februari: 'february',
            maart: 'march',
            april: 'april',
            mei: 'may',
            juni: 'june',
            juli: 'july',
            augustus: 'august',
            september: 'september',
            oktober: 'october',
            november: 'november',
            december: 'december'
        }

        let monthString = Object.keys(translate).find(x => dateString.includes(x))

        let outputString = dateString.replace(monthString, translate[monthString]);

        if (moment(outputString).isValid()) {
            return moment(outputString).format('YYYY-MM-DD')
        }

        console.error('invalid date');
    }

    /* Get date picker DATE */
    const getCalendarDate = function () {
        return $j('.picker').datepicker("getDate");
    };

    const renderShoppingCartItems = function () {

        const normalBikeImgUrl = 'https://wpbeter-ontwikkelt.nl/wp-content/themes/mountainbike-huren-schoorl/images/wc-bookings-mountainbike-small-product-image.png';
        const electricBikeImgUrl = 'https://wpbeter-ontwikkelt.nl/wp-content/themes/mountainbike-huren-schoorl/images/wc-bookings-e-mountainbike-small-product-image.png';

        //let date = '2021-04-20'
        let date = `${userSelect.date.year}-${userSelect.date.month}-${userSelect.date.day}`;


        //Build shopping cart UI
        const cartHTML = gResourceIds.map(x => {

            //we already have the resource ids, but we also need to get the resource data to
            //get the resource name
            let resource = gResourcesData.find(elem => elem.id === x);

            const imageUrl = isElectricBike(resource.name) ? electricBikeImgUrl : normalBikeImgUrl;

            //console.log(`${resource.name} rendered`);

            return `
            <div class="item" data-resource-id="${resource.id}">
                <div class="image">
                    <img src=${imageUrl} alt="" />
                </div>

                <div class="description">
                    <span class="js-slot-date" style="display: ${window.debugOn ? 'block' : 'none'}">${"[Date]"}</span>
                    <span class="wc-bookings-item-title resource-name">${resource.name}</span>
                    <div>${printBikeDescription(resource.name)}</div>
                   <span class="js-availability">Aantal beschikbaar: [slot.available] </span>
                </div>

                <div class="js-quantity quantity">
                    <button class="plus-btn" type="button" name="button">
                        <span>+</span>
                    </button>
                    <input type="number" name="qty" value="0" min="0" max="${100}">
                    <button class="minus-btn" type="button" name="button">
                        <span>-</span>
                    </button>
                </div>

                <div class="total-price"></div>
                <div class="add-bike-to-cart disabled">Toevoegen aan reservering</div>
            </div>`;
        })

        $j('.bikes-accordion-content').append(cartHTML);

        blocker.blockContentTemp("Get slots by date");

        //Update the cart items with data from slots. Remember that slots are organized in the same order as with gResourceIds so just match based on index
        dataService.getSlotsByDate(date).then(function (result) {
            //render
            result.records.forEach((slot, idx) => {

                let $item = $j('.bikes-accordion-content .item').eq(idx);

                $item.find('.js-slot-date').text(slot.date);
                $item.find('[max]').attr("max", slot.available);
                $item.find('.js-availability').text('Aantal beschikbaar: ' + slot.available);

            })

            return "OK: bike details set!"
        }).then(function (status) {
            console.log(status);
            highlightNoAvailabilityItems();
            blocker.unblockContentTemp("Get slots by date");
        })
    };

    // shows the bike description on the shopping cart page
    // params name = resource name of the bike ('S Mountainbike', 'M Elektrische mountainbike', etc)
    const printBikeDescription = function (name) {
        const keyValue = Object.keys(mySettings.bikeDescription).find(key => {
            return key.toLowerCase() === name.trim().toLowerCase();
        });

        return mySettings.bikeDescription[keyValue];
    }

    // Block All Shopping cart item controls except for the focused one
    const blockBikeItemControls = function (event) {

        // Disable only control of oher bike items not currently the one we are focused on
        $j('.item .js-quantity').not(gCartItemToUpdateDisplayPrice.closest('.item').find('.js-quantity')).block({
            message: null,
            overlayCSS: {
                backgroundColor: '#fff',
                opacity: 0.6,
                cursor: 'wait'
            },
            ignoreIfBlocked: true

        });
    };

    // When user is active changing quantity, prevent add to reservation enabling... changing quantity uses debounce so this is needed.
    const unblockBikeItemControls = function (event) {
        // Make plus-minus btns of all bike items  clickable again
        $j('.item .js-quantity').unblock();
    };

    // Determine if item is electric bike. we can use ID too but this is ok for now
    function isElectricBike(name) {
        if (typeof name === "string")
            return name.toLowerCase().includes("elektrische");

        console.warn('Passed a non string. Check!')
    };

    function onlyQuantityWasUpdated(new_qty, new_resource_id) {
        //make sure no required fields are empty
        //before proceeding to comparing if values(old & new) are the same to prevent (null == nul) which is true
        if(!allRequiredFieldsIsNotEmpty()) {
            return false; //some fields are empty
        }

        //compare if values are same except quantity/wc_bookings_field_persons
        //note: duration and product id doesn't change at all for this booking sys version
        if (
        gPostDataResource.val() != new_resource_id ||
        $j('input[name="wc_bookings_field_start_date_day"]').val() != userSelect.date.day ||
        $j('input[name="wc_bookings_field_start_date_month"]').val() != userSelect.date.month ||
        $j('input[name="wc_bookings_field_start_date_year"]').val() != userSelect.date.year) {
            return false;
        }

        return Number(gPostDataNumPersons.val()) !== Number(new_qty);
    }



    // We need to reset some inputs because on calendar select time, it triggers booking cost calculation. bookingform.js - if some dates are missing it doesn't trigger wc_bookings_calculate_costs
    const resetShoppingCartFormTimesAndResource = function () {
        $j('select#wc_bookings_field_resource').prop('selectedIndex', -1);
        $j('#wc_bookings_field_start_date').val('');
    }

    const runBikeCartScripts = function () {
        // Shopping cart bike items
        const itemsContainer = $j('.bikes-accordion-content');

        // Used event delagation below since contents are dynamically created
        itemsContainer.on('click', '.minus-btn', function (e) {
            e.preventDefault();

            const currentBike = $j(this).closest('.item');
            const quantityField = currentBike.find('input[name=qty]');

            const oldQuantity = parseInt(quantityField.val());
            const minQuantity = 0;

            // If quantity is already 0, return 0
            if (oldQuantity <= minQuantity) {
                currentBike.find('.total-price').text('');
                return;
            }

            const newQuantity = oldQuantity - 1;
            quantityField.val(newQuantity);  // Update UI quantity

            updateCartItemToUpdateDisplayPrice(currentBike);
            $j('body').trigger('singleCartItemFocused');

            // Start filling up the form
            const currentBikeResourceId = currentBike.data('resource-id');
            $j('body').trigger('startFillBookingForm', [newQuantity, currentBikeResourceId]);

        });

        itemsContainer.on('click', '.plus-btn', function (e) {
            e.preventDefault();

            const currentBike = $j(this).closest('.item');
            const quantityField = currentBike.find('input[name=qty]');

            const oldQuantity = parseInt(quantityField.val());
            const maxQuantity = parseInt(quantityField.attr('max'));

            // If qty is equal to or greater than max value, retun or do nothing
            if (oldQuantity >= maxQuantity) {
                return;
            }

            const newQuantity = oldQuantity + 1;
            quantityField.val(newQuantity); // Update UI quantity

            updateCartItemToUpdateDisplayPrice(currentBike);
            $j('body').trigger('singleCartItemFocused');


            // Start filling up the form
            const currentBikeResourceId = currentBike.data('resource-id');
            $j('body').trigger('startFillBookingForm', [newQuantity, currentBikeResourceId]);

        });

        itemsContainer.on('click', '.add-bike-to-cart', function (e) {

            $j('button.single_add_to_cart_button').click();

        });
    };

    // Reset quantity of the unfocused shopping cart items
    const resetUnfocusedBikesQuantity = function () {
        $j('.item .js-quantity input[name=qty]').not(gCartItemToUpdateDisplayPrice.closest('.item').find('.js-quantity input[name=qty]')).val(0);
    };

    const resetBookingProcess = function () {
        // Close all active modals
        while ($j.modal.getCurrent() != null) {
            $j.modal.close();
        }
    };

    const resetAllBikesPriceUi = function () {
        $j('.item .total-price').text("");
    }

    // Adds a class to items container so we can determine if user is still actively updating quantity and still waiting for debounce function to execute
    const notifyStartDebounceWait = function () {
        const itemsContainer = $j('.bikes-accordion-content');
        itemsContainer.addClass('js-user-is-active');
    };

    const notifyEndDebounceWait = function () {
        const itemsContainer = $j('.bikes-accordion-content');
        itemsContainer.removeClass('js-user-is-active');
    };

    // Check if debounce function(startFillBookingForm) hasn't executed yet
    // @returns true -  if still waiting / debounce hasn't executed yet
    const isWaitingForDebounce = function () {
        const itemsContainer = $j('.bikes-accordion-content');
        return itemsContainer.hasClass('js-user-is-active');
    };

    // @params {name} text. set the name to replace the OPC text msg on add/remove item
    const setAddedOrRemovedItemResourceName = function (name) {
        if (!name) {
            console.warn('check value of name')
            return;
        }
        addedOrRemovedItemResourceName = name;
    };

    const getAddedOrRemovedItemResourceName = function () {
        return addedOrRemovedItemResourceName || "Mountainbike";
    };

    return {
        init,
        showPrimaryModal,
        toggleAddToCartBtn,
        getCalendarDate,
        renderShoppingCartItems,
        resetShoppingCartFormTimesAndResource,
        resetBookingProcess,
        updateCheckoutItems,
        setAddedOrRemovedItemResourceName,
        getAddedOrRemovedItemResourceName

    };
})()
// End BookingTabSteps Module


//time-picker.js - wc_bookings_get_blocks is triggered/initiated by changes to #wc_bookings_field_duration,
//#wc_bookings_field_resource, and .wc-bookings-booking-form fieldset(on 'date-selected'). in this ala-module we just
//try to track the initiator and then we can handle what actions should be done/not done
const getBlocksRequest = {

    Triggers: {
        DATE_SELECT: 1,
        RESOURCE_CHANGE: 2,
        QUANTITY_CHANGE: 3
    },

    initiator: '',

    getInitiator() {
        return this.initiator;
    },

    setInitiator(val) {

        var acceptedValues = Object.values(this.Triggers);
        if (!acceptedValues.includes(Number(val))) {
            console.error('invalid initator passed');
            return;
        }
        this.initiator = val;
    },

    resetInitiator() {
        this.initiator = '';
    }
};

const dataService = {

    // @params cb=callback
    getProducts() { return $j.getJSON(`${gMainUrl}/wp-json/wc-bookings/v1/products`) },

    getResources() { return $j.getJSON(`${gMainUrl}/wp-json/wc-bookings/v1/resources`) },

    getSlotsByDate(date) {
        //if there are issue, check if date args is already formatted as 'YYYY-MM-DD'
        const maxDate = moment(date, "YYYY-MM-DD").add(1, 'days').format('YYYY-MM-DD');
        const api = `${gMainUrl}/wp-json/wc-bookings/v1/products/slots?min_date=${date}&max_date=${maxDate}`;

        return $j.getJSON(api);
    },

    logFail(jqXHR, textStatus, errorThrown) {
        console.error(textStatus);
    },

    // Show connection error msg and ask user to reload page
    notifyConnectionErrorReload(jqXHR, textStatus) {

        if (jqXHR.readyState == 0 || textStatus == 'timeout') {

            $j('.generic-modal').html(`
                <div class="connection-error">
                    <div class="connection-error-message">${mySettings.errorMsg.reloadPage}</div>
                    <div class="btn-container">
                        <div class="connection-error-btn js-reload-page-btn">${mySettings.errorMsg.reloadPageBtnTxt}</div>
                    </div>
                </div>`);

            $j('.generic-modal').modal({
                showClose: false,
            });
        }
    },

    // Show connection error msg and ask user to retry
    notifyConnectionErrorRetry(jqXHR, textStatus) {

        if (jqXHR.readyState == 0 || textStatus == 'timeout') {

            $j('.generic-modal').html(`
                <div class="connection-error">
                    <div class="connection-error-message">${mySettings.errorMsg.tryAgain}</div>
                    <div class="btn-container">
                        <div class="connection-error-btn js-restart-booking-btn">${mySettings.errorMsg.retryBtnTxt}</div>
                    </div>
                </div>`);

            $j('.generic-modal').modal({
                closeExisting: false, // No need to close primary modal if it is already open.
                showClose: false,
            });
        }
    },

    // Show connection error msg when user attempts to checkout order
    notifyConnectionErrorOnCheckoutAttempt(jqXHR, textStatus) {
        if (jqXHR.readyState == 0 || textStatus == 'timeout') {

            $j('.generic-modal').html(`
                <div class="connection-error">
                    <div class="connection-error-message">${mySettings.errorMsg.reserveAgain}</div>
                    <div class="btn-container">
                        <div class="connection-error-btn js-close-modal">${mySettings.errorMsg.reserveAgainBtn}</div>
                    </div>
                </div>`);

            $j('.generic-modal').modal({
                closeExisting: false, // No need to close primary modal if it is already open.
                showClose: false,
            });
        }
    }
}

$j(document).ready(function () {

    // Create our custom user experience. Stuff here can also be done in the theme files later when already familiar with WP
    manipulateDom.start();
    bookingTabSteps.init();

    // Override datepicker defaults.
    $j.datepicker.setDefaults({
        changeMonth: true,
        changeYear: true,
    });
    $j(".picker").datepicker("option", "showOtherMonths", false);

    // Override jquery-modal defaults
    $j.extend($j.modal.defaults, {
        escapeClose: false,
        clickClose: false,
    });

    //fetch producs and resources from api
    dataService.getProducts()
        .done(function (result) {
            var product = result[0]; // We're only expecting 1 product(with mult resources)
            gResourceIds = product.resource_ids;
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            console.error('getProducts error')
            dataService.notifyConnectionErrorReload(jqXHR, textStatus);
        });

    dataService.getResources().done(resources => {
        gResourcesData = resources;
    })
});


// Moving the calendar inside form.cart back to its original location when all modals closed

gFormCart.on($j.modal.AFTER_CLOSE, function (event, modal) {

    // Hide non-modal-primary elements
    bringBackFormCartToOriginalLocation();

    // Hides non-modal-primary elements.

    $j('.picker').toggleClass('hidden', false);

    $j('.booking-popup-header').hide();
    $j('.single_add_to_cart_button').hide();

    $j('.tabs-nav a[href="#tab-1"]').trigger('switchActiveTab');

    // Unblock blockers
    blocker.unblockContentTemp('filling up booking form');
});

function bringBackFormCartToOriginalLocation() {
    gFormCart.insertAfter('.woocommerce-product-details__short-description');

    // Remove manually the style attributes of modal-primary which was added  by calling modal()
    gFormCart.removeAttr('style');
    gFormCart.removeClass('modal-primary modal');
};

// ON MODAL OPEN EVENT
gFormCart.on($j.modal.OPEN, function (event, modal) {

    $j('.booking-popup-header').show();

    $j('.single_add_to_cart_button').show();
    // $j('form.cart').append($j(".receipt"))

    // If user has not selected a date yet, open the modal witht he datepicker calendar visible
    var userHasSelectedDate = $j('.booking_date_year') && $j('.booking_date_month') && $j('.booking_date_day');

    if (!userHasSelectedDate) {
        $j('.picker').toggleClass('hidden', false);
    }

    // To xfr
    $j('input[name="booking_time"]').prop('checked', false);
});

gPostDataNumPersons.on('change', function () {
    $j('.total-amount').text($j('.woocommerce-Price-amount.amount').text());
});

//updates bike quantity and trigger change event if params{bool} trigger is set to true
// Note: triggering change also triggrs an AJAX request
function updateFormBikeQuantity(value, trigger=false) {
    if( trigger ) {
        gPostDataNumPersons.val(value).change();
        getBlocksRequest.setInitiator(getBlocksRequest.Triggers.QUANTITY_CHANGE);  // refer to ajaxSuccess / ajaxError and find wc_bookings_get_blocks to trace next action
    } else {
        gPostDataNumPersons.val(value)
    }
}

// All hiding and showing of the prev button must be handled here...
function updatePrevBtnVisibility() {
    const activeTab = $j('.tabs-nav .js-tab-active');
    const btn = $j('.prev-btn');

    // If its not tab-1 AND the button is hidden, then show it
    if (activeTab.children('a').attr('href') !== '#tab-1' && btn.not(':visible')) {
        btn.css("visibility", "visible");
    } else {
        btn.css("visibility", "hidden");
    }
}

/**
* *|| UI texts/label manager
* To encapsulate(not all) code related to setting dynamic labels/texts.
* Don't put anything that doesn't return a string or not related to updating a text
* reminder:  as much as possible. place all code related to setting dynamic strings here for one place access
*/
const uiText = {
    fullDayReturnTime(date) {
        // Current rule is..bike can be returned at 6pm/18:00 on weekdays, and 5pm/17:00 on weekends.
        // Doesn't change the cost, just change the UI
        let calendarDate = $j('.picker').datepicker("getDate");

        // If date argument is passed use it instead. if not get the current calendar date
        if (date) {
            // Currently used in checkout page, where we need to update the order item return time display
            calendarDate = date;
        }

        // IsWeekend already checks if date is valid
        return isWeekend(calendarDate) ? '17:00' : '18:00';
    },

    // Returns the formatted date(Mon 6 January) or returns  '' a success returns a string so return '' instead of null, undefined, false
    displayDate() {

        var month = $j('[name="wc_bookings_field_start_date_month"]').val(),
            day = $j('[name="wc_bookings_field_start_date_day"]').val(),
            year = $j('[name="wc_bookings_field_start_date_year"]').val();

        // Keep this as it is which returns an empty string. Do not put any text value here because..
        //I'm using it on other parts of the codebase too - If ( !uiText.getDate() set text to 'choose date' )
        if (!month || !day || !year) {
            return '';
        }

        var dateIdx = month + '-' + day + '-' + year;

        return this.uiText = moment(dateIdx, 'MM-DD-YYY').locale('nl').format('dddd D MMMM');
    },

    // @params name = product name in db to be converted
    displayProductLabel(name) {
        return name.includes('Elektrische') ? mySettings.productLabel.electric : mySettings.productLabel.mtb;
    },

    updateShoppingCartBookingInfo() {
        //update UIs
        $j('#tab-4 .selected-time').text(uiText.displayDate());
        $j('.pickup-time').text('09:00');
        $j('.return-time').text(uiText.fullDayReturnTime());
    },

    // Change default text(product name) to the resource name
    updateOpcMessageToShowResourceName() {

        const wooMsg = $j('#opc-messages .woocommerce-message');
        const newMsg = wooMsg.text().replace("Huur mountainbikes in Schoorl", bookingTabSteps.getAddedOrRemovedItemResourceName);

        wooMsg.text(newMsg);

        // Render new opc msg with slidedown effect..
        wooMsg.hide().slideDown("fast");
    }
}

/* Blocking user interactions. Shows loader/spinner */
var blocker = {
    blockContentTemp() {
        $j('form.cart').block({
            message: `<svg class='spinner' viewBox='0 0 50 50'><circle class='path' cx='25' cy='25' r='20' fill='none' /></svg>`,
            overlayCSS: mySettings.spinner.blockUIOverlayCSS,
            css: { border: 0 },
        });
    },

    unblockContentTemp() {
        $j('form.cart').unblock();
    },

    // @params message - just a custom msg for devs in the future to track when the block happens and ends
    blockCalendar(msg = '') {
        $j('.picker').block({
            message: `<svg class='spinner' viewBox='0 0 50 50'><circle class='path' cx='25' cy='25' r='20' fill='none' /></svg>`,
            overlayCSS: mySettings.spinner.blockUIOverlayCSS,
            css: { border: 0 },
        });
    },

    // @params message - just a custom msg for devs in the future to track when the block happens and ends
    unblockCalendar(msg = '') {
        $j('.picker').unblock();
    },

};

function isWeekend(date) {
    return moment(date).day() == 6 || moment(date).day() == 0; // a 0 or a 6 is a Weekend!;
}

$j('.generic-modal').on($j.modal.AFTER_CLOSE, function (event, modal) {
    // HACK.. with the generic modal it takes twice to close to really close item
    let esc = $j.Event("keydown", { keyCode: 27 });
    $j(this).trigger(esc);
});

// This can just be done via css. checkout page hide the red text and and red border on Een account aanmaken? checkbox click
$j('.create-account').on('change', function () {
    $j('.woocommerce form .form-row.woocommerce-invalid input.input-text').css('border-color', 'rgb(221, 221, 221)');
    $j('.woocommerce form .form-row.woocommerce-invalid label').css('color', '#444')
})

// Color red items with no availability
function highlightNoAvailabilityItems() {
    const numberPattern = /\d+/g;

    $j('.shopping-cart-container .js-availability').each(function (idx, el) {

        if (el.textContent.match(numberPattern) == null) {
            console.error('invalid availability amount');
            return;
        }

        const avail = el.textContent.match(numberPattern)[0];
        let isOutOfStock = Number(avail) < 1;
        $j(this).css('color', isOutOfStock ? '#D83F35' : '#444')
    })
}

const debounce = function (func, delay) {

    let debounceTimer
    return function () {
        const context = this; // Box-1 or box-2 el
        const args = arguments
        clearTimeout(debounceTimer)
        debounceTimer
            = setTimeout(() => func.apply(context, args), delay)
    }
}

// Make sure no blocked dates / red dates... clear select bicycle dropdown
function removeCalendarBlockedDates() {
    if ($j('.ui-datepicker-calendar .fully_booked').length > 0) {
        $j('#wc_bookings_field_resource').prop('selectedIndex', -1).change();
    }
    console.log('removeCalendarBlockedDates called');
}

function allRequiredFieldsIsNotEmpty() {
    var names = ["add-to-cart", "wc_bookings_field_duration", "wc_bookings_field_persons", "wc_bookings_field_resource", "wc_bookings_field_start_date_day","wc_bookings_field_start_date_month","wc_bookings_field_start_date_year"]

    //check if there are falsy values- undefined, null, NaN, 0, "" (empty string)
    return names.every(name => {
        return Boolean($j(`[name=${name}]`).val())
    })
}

//DISABLE ALERTS. seems that I don't need this b
function disableAlerts() {
    window.alert = function () { };
}
disableAlerts();
