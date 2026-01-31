// ==UserScript==
// @name         Malaysia Digital Arrival Card (MDAC) Enhancements
// @namespace    https://github.com/mannylee
// @version      2025-11-08
// @description  Autopopulate fields in the MDAC & fix field manipulation
// @author       mannylee
// @match        https://imigresen-online.imi.gov.my/mdac/main?registerMain
// @icon         https://imigresen-online.imi.gov.my/mdac/images/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

const MDACEnhancements = {
    CONFIG: {
        PEOPLE: null,
        PERSON: {},
        ADDRESS: {},
        TRAVELINFO: {
            vesselNm: "BUS",
            trvlMode: "2",
            embark: "SGP",
        },
        ADDRESSES: {
            CitySquareMall: {
                accommodationStay: "99",
                accommodationAddress1: "JALAN WONG AH FOOK",
                accommodationAddress2: "BANDAR JOHOR BAHRU",
                accommodationState: "01",
                accommodationPostcode: "80000",
                accommodationCity: "0100"
            },
            KSL: {
                accommodationStay: "01",
                accommodationAddress1: "KSL RESORT JB CITY CENTER",
                accommodationAddress2: "JALAN SELADANG, TAMAN ABAD",
                accommodationState: "01",
                accommodationPostcode: "80250",
                accommodationCity: "0100"
            },
            Penang: {
                accommodationStay: "01",
                accommodationAddress1: "15 LEBUH LEITH",
                accommodationAddress2: "GEORGE TOWN, PULAU PINANG",
                accommodationState: "07",
                accommodationPostcode: "10200",
                accommodationCity: "0708",
                trvlMode: "1",
                vesselNm: ""
            }
        },
        FIELDS_NEED_REFRESH: { accommodationState: "accommodationCity" },
        FIELDS_ALLOW_COPY_PASTE: ["email","confirmEmail","mobile","accommodationAddress1","accommodationAddress2"],
        FIELDS_ALLOW_EDIT: ["dob","passExpDte","arrDt","depDt"],
        FIELDS_DISABLE_AUTOCOMPLETE: ["passNo","email","confirmEmail","mobile","dob","passExpDte","arrDt","depDt"]
    },

    load() {
        this.log(`v${GM_info.script.version}`);
        this.fieldsEnhancements();
        this.initPeople();
        this.promptPerson();
        this.promptAddress();
    },

    promptForChoice(promptMsg, keys) {
        const choiceIndex = parseInt(
            prompt(`${promptMsg}: ${keys.map((k,i) => `${i+1} = ${k}`).join(", ")}`),
            10
        ) - 1;

        // Return null if invalid
        if (choiceIndex < 0 || choiceIndex >= keys.length || isNaN(choiceIndex)) {
            return null;
        }

        return keys[choiceIndex];
    },

    promptPerson(){
        const personKey = MDACEnhancements.promptForChoice("Choose person", Object.keys(MDACEnhancements.CONFIG.PEOPLE));
        MDACEnhancements.CONFIG.PERSON = personKey ? MDACEnhancements.CONFIG.PEOPLE[personKey] : null;

        // Fill personal details
        Object.entries(MDACEnhancements.CONFIG.PERSON).forEach(([key, val]) => {
            const elem = document.getElementById(key);
            if (elem && elem.value !== val) {
                elem.value = val;
            }
        });
    },
    promptAddress(){
        const addressKey = MDACEnhancements.promptForChoice("Choose address", Object.keys(MDACEnhancements.CONFIG.ADDRESSES));
        MDACEnhancements.CONFIG.ADDRESS = addressKey
            ? { ...MDACEnhancements.CONFIG.TRAVELINFO, ...MDACEnhancements.CONFIG.ADDRESSES[addressKey] }
        : null;

        // Fill in travel details
        for (const key in MDACEnhancements.CONFIG.ADDRESS) {
            const elem = document.querySelector("#" + key);
            if (!elem) continue;

            elem.value = MDACEnhancements.CONFIG.ADDRESS[key];

            if (MDACEnhancements.CONFIG.FIELDS_NEED_REFRESH.hasOwnProperty(key)) {
                // Nested setTimeout to handle page JS updating dependent fields
                setTimeout(() => {
                    elem.dispatchEvent(new Event('change'));
                    const refreshKey = MDACEnhancements.CONFIG.FIELDS_NEED_REFRESH[key];
                    const refreshElem = document.querySelector("#" + refreshKey);
                    if (refreshElem) {
                        setTimeout(() => {
                            refreshElem.value = MDACEnhancements.CONFIG.ADDRESS[refreshKey];
                        }, 1000); // delay for dependent field to be updated
                    }
                }, 500); // initial delay
            }
        }
    },

    initPeople() {
        this.CONFIG.PEOPLE = GM_getValue('PEOPLE') || {
            Person1: {
                name: "",
                passNo: "",
                dob: "",
                nationality: "CAN",
                sex: "1",
                passExpDte: "",
                email: "@gmail.com",
                confirmEmail: "@gmail.com",
                region: "65",
                mobile: ""
            }
        };
        GM_setValue('PEOPLE', this.CONFIG.PEOPLE);
    },

    fieldsEnhancements() {
        // force fields to allow pasting
        this.CONFIG.FIELDS_ALLOW_COPY_PASTE.forEach(id=>{
            const elem = document.getElementById(id);
            if(elem) elem.oncopy = elem.onpaste = "return true;";
        });

        // Force fields to be editable
        this.CONFIG.FIELDS_ALLOW_EDIT.forEach(id=>{
            document.getElementById(id)?.removeAttribute("readonly");
        });

        // Force fields to be editable
        this.CONFIG.FIELDS_DISABLE_AUTOCOMPLETE.forEach(id=>{
            const el = document.getElementById(id);
            el?.setAttribute('autocomplete', 'off');       // main
            el?.setAttribute('autocorrect', 'off');        // optional
            el?.setAttribute('autocapitalize', 'off');     // optional
            el?.setAttribute('spellcheck', 'false');       // optional
        });

        // Lazy email hack
        document.getElementById("email").addEventListener('input', function() {
            // Update confirm email with the value of email input
            document.getElementById("confirmEmail").value = document.getElementById("email").value;
        });
        document.getElementById("confirmEmail").addEventListener('input', function() {
            // Update confirm email with the value of email input
            document.getElementById("email").value = document.getElementById("confirmEmail").value;
        });
        
        this.retryUntilSuccess(function() {
            // Check if jQuery is ready
            if ($('body')) {
                // Your existing code to disable date picker and set default dates
                $('#dob').off();
                $('#passExpDte').off();

                // Set default arrival and departure dates to tomorrow
                var tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                $('#arrDt').datepicker('setDate', tomorrow);
                $('#depDt').datepicker('setDate', tomorrow);

                // Allow user to select new person
                $('a:contains("Personal Information")')
                    .removeAttr('data-parent')
                    .removeAttr('href')
                    .click(MDACEnhancements.promptPerson);

                // Allow user to select new address
                $('a:contains("Traveling Information")')
                    .removeAttr('data-parent')
                    .removeAttr('href')
                    .click(MDACEnhancements.promptAddress);

                // Remove the reset button
                $("#reset").remove();

                return true; // Return true to stop retrying
            }
            return false; // Return false to keep retrying
        }, 15, 200); // Retry up to 15 times, every 200ms
    },

    retryUntilSuccess(callback, maxAttempts = 10, interval = 100) {
        let attempts = 0;

        function tryExecute() {
            if (callback()) {
                // Condition met (callback returned true), execute the action
            } else if (attempts < maxAttempts) {
                // Condition not met, retry after interval
                attempts++;
                setTimeout(tryExecute, interval);
            } else {
                MDACEnhancements.log('Max attempts reached, condition not met.');
            }
        }

        tryExecute();
    },

    log(value) { console.info(`${GM_info.script.name}: ${value}`); }
};

MDACEnhancements.load();
window.MDACEnhancements = MDACEnhancements;
