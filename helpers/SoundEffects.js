/* jshint expr: true */

define(
        [
            "jquery",
            "tools",
            "howler"
        ],
    function($, tools) {


        return function(inputs) {


            if (!inputs || typeof inputs !== "object") {
                console.log("SoundEffects got some bad inputs!");
                return false;
            }


            const soundEffectsKey = "assignmentSoundEffects";
            const settings = $.extend({
                checkbox: null,
                playThisOnCheckboxCheck: true,
            }, inputs);


            if (!settings.sounds) {
                $("#sounds-effects-checkbox-label").remove();
                return false;
            }


            const $sfCheckbox = settings.checkbox || $("#sound-effects-checkbox");
            const bgmURL = settings.bgmURL;


            let sounds = {}; // e.g. { chime: "/sounds/chimeSound.mp3" }


            const sfCheckbox = tools.checkboxStateHandler({
                checkbox: $sfCheckbox,
                localStorageKey: "assignmentSoundEffects",
                defaultToChecked: true,
                onCheck: function() {
                    settings.playThisOnCheckboxCheck && play(settings.playThisOnCheckboxCheck);
                },
            });


            // preparing the sounds, using new Howl objects
            inputs.sounds && Object.keys(inputs.sounds).length > 0 && addSounds(inputs.sounds);


            function play(thisSound) {
                sfCheckbox.isChecked() && sounds[thisSound] && sounds[thisSound].play();
            }


            function pause(thisSound) {
                sounds[thisSound] && sounds[thisSound].pause();
            }


            function addSounds(soundObjects) {
                Object.keys(soundObjects).forEach(function(thisSound) {
                    if (!soundObjects[thisSound]) { return; }
                    sounds[thisSound] = new Howl({
                        src: [soundObjects[thisSound]]
                    });
                });
            }


            // finally, returning the play function
            this.play = play;
            this.addSounds = addSounds;
            this.pause = pause;
            this.areOn = function() {
                return sfCheckbox.isChecked();
            };
        };
    });