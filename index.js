/* ============================================================
   Typer — mortuary.txt edition, single-knob speed control
   ============================================================ */

// ======================= CONFIG ============================
var SPEED_MULTIPLIER = 1;      // 1 = original pace
                              // 2 = twice as fast
                              // 4 = fast skim
                              // 10+ = effectively instant

var TEXT_FILE = "mortuary.txt";

var BASE_SPEED        = 3;     // chars per tick @ multiplier 1 (stock value)
var BASE_TICK_MS      = 30;    // ms per tick    @ multiplier 1 (stock value)
var BASE_SCROLL_STEP  = 50;   // px per tick     @ multiplier 1 (stock value)
var CURSOR_BLINK_MS   = 500;  // caret blink, independent feel knob
// ===========================================================

// Derived values — no other tuning needed below this line
Typer.speed      = BASE_SPEED * SPEED_MULTIPLIER;
var TICK_MS      = Math.max(1, Math.round(BASE_TICK_MS     / SPEED_MULTIPLIER));
var SCROLL_STEP  = Math.max(1, Math.round(BASE_SCROLL_STEP / SPEED_MULTIPLIER));

var Typer = {
    text: null,
    accessCountimer: null,
    index: 0,
    file: "",
    accessCount: 0,
    deniedCount: 0,

    init: function () {
        accessCountimer = setInterval(function () {
            Typer.updLstChr();
        }, CURSOR_BLINK_MS);

        $.get(Typer.file, function (data) {
            Typer.text = data;
            Typer.text = Typer.text.slice(0, Typer.text.length - 1);
        });
    },

    content: function () {
        return $("#console").html();
    },

    write: function (str) {
        $("#console").append(str);
        return false;
    },

    addText: function (key) {

        // Easter eggs: Alt x3 = access, CapsLock x3 = denied
        if (key.keyCode == 18) {
            Typer.accessCount++;
            if (Typer.accessCount >= 3) {
                Typer.makeAccess();
            }
        }

        else if (key.keyCode == 20) {
            Typer.deniedCount++;
            if (Typer.deniedCount >= 3) {
                Typer.makeDenied();
            }
        }

        else if (key.keyCode == 27) {
            Typer.hidepop();
        }

        else if (Typer.text) {
            var cont = Typer.content();

            // strip trailing cursor before rewriting
            if (cont.substring(cont.length - 1, cont.length) == "|")
                $("#console").html($("#console").html().substring(0, cont.length - 1));

            // forward = advance, backspace = rewind (manual typing)
            if (key.keyCode != 8) {
                Typer.index += Typer.speed;
            } else {
                if (Typer.index > 0)
                    Typer.index -= Typer.speed;
            }

            var text = Typer.text.substring(0, Typer.index);
            var rtn = new RegExp("\n", "g");

            $("#console").html(text.replace(rtn, "<br/>"));
            window.scrollBy(0, SCROLL_STEP);
        }

        // block default key behavior except F11 (fullscreen)
        if (key.preventDefault && key.keyCode != 122) {
            key.preventDefault();
        }

        if (key.keyCode != 122) {
            key.returnValue = false;
        }
    },

    updLstChr: function () {
        var cont = this.content();

        if (cont.substring(cont.length - 1, cont.length) == "|")
            $("#console").html($("#console").html().substring(0, cont.length - 1));
        else
            this.write("|");
    }
};

function replaceUrls(text) {
    var http = text.indexOf("http://");
    var space = text.indexOf(".me ", http);

    if (space != -1) {
        var url = text.slice(http, space - 1);
        return text.replace(url, "<a href=\"" + url + "\">" + url + "</a>");
    } else {
        return text;
    }
}

// ===================== BOOTSTRAP =====================
Typer.file = TEXT_FILE;
Typer.init();

// Auto-type driver: fires addText with a dummy keyCode (not 8, not an egg)
var timer = setInterval("t();", TICK_MS);

function t() {
    Typer.addText({ "keyCode": 123748 });

    if (Typer.index > Typer.text.length) {
        clearInterval(timer);
    }
}
