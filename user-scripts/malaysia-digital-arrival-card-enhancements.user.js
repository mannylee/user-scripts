// ==UserScript==
// @name         Malaysia Digital Arrival Card (MDAC) Enhancements
// @namespace    https://github.com/mannylee
// @version      2025-11-01
// @description  Autopopulate fields in the MDAC & fix field manipulation
// @author       mannylee
// @match        https://imigresen-online.imi.gov.my/mdac/main?registerMain
// @icon         https://imigresen-online.imi.gov.my/mdac/images/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

const getTomorrowDate = (offset) => {
    const today = new Date();
    today.setDate(today.getDate() + 1 + (offset || 0));
    return `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
};

const MDACEnhancements = {
    CONFIG: {
        PEOPLE: null,
        PERSON: {},
        ADDRESS: {},
        TRAVELINFO: {
            arrDt: getTomorrowDate(),
            depDt: getTomorrowDate(),
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
                vesselNm: "",
                depDt: getTomorrowDate(1)
            }
        },
        FIELDS_NEED_REFRESH: { accommodationState: "accommodationCity" },
        FIELDS_ALLOW_COPY_PASTE: ["email","confirmEmail","mobile","accommodationAddress1","accommodationAddress2"],
        FIELDS_ALLOW_EDIT: ["dob","passExpDte","arrDt","depDt"]
    },

    load() {
        this.log(`v${GM_info.script.version}`);
        this.fieldsEnhancements();
        this.initPeople();
        this.promptForOptions();
        this.autofill();
    },

    promptForChoice(promptMsg, keys) {
        let choiceIndex = parseInt(prompt(`${promptMsg}: ${keys.map((k,i) => `${i+1} = ${k}`).join(", ")}`),10) - 1;
        if (choiceIndex < 0 || choiceIndex >= keys.length) {
            alert("Invalid choice, defaulting to first option.");
            choiceIndex = 0;
        }
        return keys[choiceIndex];
    },

    promptForOptions() {
        const personKey = this.promptForChoice("Choose person", Object.keys(this.CONFIG.PEOPLE));
        this.CONFIG.PERSON = this.CONFIG.PEOPLE[personKey];

        const addressKey = this.promptForChoice("Choose address", Object.keys(this.CONFIG.ADDRESSES));
        this.CONFIG.ADDRESS = {...this.CONFIG.TRAVELINFO, ...this.CONFIG.ADDRESSES[addressKey]};
    },

    autofill() {
        // Fill personal details
        Object.entries(this.CONFIG.PERSON).forEach(([key, val]) => {
            const elem = document.getElementById(key);
            if (elem && elem.value !== val) {
                elem.value = val;
            }
        });

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
        this.CONFIG.FIELDS_ALLOW_COPY_PASTE.forEach(id=>{
            const elem = document.getElementById(id);
            if(elem) elem.oncopy = elem.onpaste = ()=>true;
        });
        this.CONFIG.FIELDS_ALLOW_EDIT.forEach(id=>{
            document.getElementById(id)?.removeAttribute("readonly");
        });
    },

    log(value) { console.info(`${GM_info.script.name}: ${value}`); }
};

MDACEnhancements.load();
window.MDACEnhancements = MDACEnhancements;
