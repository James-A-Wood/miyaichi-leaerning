
define(
        [
            "jquery"
        ],
        function ($) {


            return function (inputs) {


                // error checking
                if (!inputs || typeof inputs !== "object" || !inputs.class) {
                    console.log("tools.tabFocusByArrowKey got some bad arguments!");
                    return;
                }


                // default step = 1
                var step = 1;


                // wiring up the listener
                $(document).on("keydown", arrowKeysMoveFocusHandler);
                function arrowKeysMoveFocusHandler(e) {


                    // exiting if Shift, Ctrl, or Alt is pressed
                    if (e.shiftKey || e.altKey || e.ctrlKey) {
                        return;
                    }


                    // exiting if not the up- or down-arrow
                    if (e.keyCode !== 38 && e.keyCode !== 40) {
                        return;
                    }


                    // saving reference to the currently focused item
                    var $currentlyFocused = $(":focus");


                    // exiting if no element has focus, or if the focused element doesn't have the class inputs.class
                    if (!($currentlyFocused && $currentlyFocused.hasClass(inputs.class))) {
                        return;
                    }


                    // preventing the page from scrolling
                    e.preventDefault();


                    // getting the index of the $currentlyFocused from among all the elements with input.class WHICH ARE NOT HIDDEN!
                    var index = $("." + inputs.class).filter(function () {
                        return $(this).css("display") !== "none";
                    }).index($currentlyFocused);


                    // moving up or down, depending on e.keyCode
                    index += (e.keyCode === 40) ? step : -step;


                    // keeping index greater than or equal to 0
                    index = (index < 0) ? 0 : index;


                    // finally, setting focus on the new element which is displayed
                    $("." + inputs.class).filter(function () {
                        return $(this).css("display") !== "none";
                    }).eq(index).focus();
                }


                // returning a function to set the step
                return {
                    setStep: function (newStep) {
                        step = newStep;
                    }
                };

            };

        }
);