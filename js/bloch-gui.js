window.addEventListener('load', init);

function isQubit(raw_token) {
    return (raw_token[0] == 'q');
}

commands = {
    log: function (args) {
        consoleWrite(args);
    },
    print: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            qubit = blochs[index].qubit;
        }
        var qubit_state = "( "+qubit.c0.re+"+"+qubit.c0.im+"i , "+qubit.c1.re+"+"+qubit.c1.im+"i )";
        consoleWrite(qubit_state);
    },
    move: function (args) {
        if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            if (index < bloch_num) {
                current_bloch_index = index;
                highlightBlochArea(index);
            }
        } else {
            getNextBloch();
        }
    },
    set: function (args) {
        var bloch;
        if (isQubit(args[0])) {
            bloch = blochs[parseInt(args[0].slice(1), 10)];
            args = args.slice(1);
        } else {
            bloch = getCurrentBloch();
        }
        var c0 = math.complex(args[0]);
        var c1 = math.complex(args[1]);
        var r = math.sqrt(math.pow(c0.abs(), 2)+math.pow(c1.abs(), 2))
        c0 = math.divide(c0, r);
        c1 = math.divide(c1, r);
        var qubit = new Qubit(c0, c1);
        bloch.blochPlot(qubit);
        bloch.blochRender();
    },
    probe: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            qubit = blochs[index].qubit;
        }
        consoleWrite(qubit.probe());
    },
    I: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            var bloch = blochs[index];
            qubit = bloch.qubit;
        } else {
            qubit = commands[args[0]](args.slice(1));
        }
        if (qubit) {
            return I(qubit);
        }
    },
    X: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            var bloch = blochs[index];
            qubit = bloch.qubit;
        } else {
            qubit = commands[args[0]](args.slice(1));
        }
        if (qubit) {
            return X(qubit);
        }
    },
    Y: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            var bloch = blochs[index];
            qubit = bloch.qubit;
        } else {
            qubit = commands[args[0]](args.slice(1));
        }
        if (qubit) {
            return Y(qubit);
        }
    },
    Z: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            var bloch = blochs[index];
            qubit = bloch.qubit;
        } else {
            qubit = commands[args[0]](args.slice(1));
        }
        if (qubit) {
            return Z(qubit);
        }
    },
    H: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            var bloch = blochs[index];
            qubit = bloch.qubit;
        } else {
            qubit = commands[args[0]](args.slice(1));
        }
        if (qubit) {
            return H(qubit);
        }
    },
    S: function (args) {
        var qubit;
        if (args.length == 0) {
            qubit = getCurrentBloch().qubit;
        } else if (isQubit(args[0])) {
            var index = parseInt(args[0].slice(1), 10);
            var bloch = blochs[index];
            qubit = bloch.qubit;
        } else {
            qubit = commands[args[0]](args.slice(1));
        }
        if (qubit) {
            return S(qubit);
        }
    },
    copy: function (dest, args) {
        var qdest_index = parseInt(dest.slice(1), 10);
        var qsrc;
        if (isQubit(args[0])) {
            if (args.length == 1) {
                qsrc = blochs[parseInt(args[0].slice(1), 10)].qubit;
            } else {
                if (args[1] == "=") {
                    args[1] = "copy";
                    qsrc = commands[args[1]](args[0], args.slice(2));
                }
            }
        } else {
            qsrc = commands[args[0]](args.slice(1));
        }
        if (qsrc) {
            blochs[qdest_index].blochPlot(qsrc);
            blochs[qdest_index].blochRender();
        }
        return qsrc;
    }
};

var blochAreas;
var bloch_num;
var current_bloch_index = 0;
var consoleWrite;

function init() {
    blochAreas = $('.bloch');
    const blochCanvases = $('.bloch canvas');
    blochInit(blochCanvases);
    bloch_num = blochCanvases.length;
    console.log(bloch_num);

    const editer = $("#input .editer");
    const history = $(".console #history");
    editer.keydown(function(event) {
        if (event.keyCode === 13) {
            var input = editer.text();
            history.append("<div class=\"historyLine\"><span class=\"prompt\">&gt;</span><span class=\"editer\">"+input+"</span></div>");
            history[0].scrollTop = history[0].scrollHeight;
            editer.text("");

            try {
                exec(input); 
            } catch (e) {
                history.append("<div class=\"historyLine\"><span class=\"editer error\">"+e+"</span></div>");
                throw e;
            } finally {
                return false;
            }
        }
        return true;
    });

    consoleWrite = function(msg) {
        history.append("<div class=\"historyLine\"><span class=\"prompt\"></span><span class=\"editer\">"+msg+"</span></div>");
        history[0].scrollTop = history[0].scrollHeight;
    }
    highlightBlochArea(current_bloch_index);
}

var highlighted_blochArea = undefined;

function highlightBlochArea(index) {
    var blochArea = blochAreas[index];
    blochArea.style.border = "solid 5px lime";
    if (highlighted_blochArea) {
        highlighted_blochArea.style.border = "solid 0px lime";
        highlighted_blochArea = blochArea;
    }
    highlighted_blochArea = blochArea;
}

function getCurrentBloch() {
    if (current_bloch_index < bloch_num) {
        return blochs[current_bloch_index];
    }
}

function getNextBloch() {
    current_bloch_index = (current_bloch_index + 1) % bloch_num;
    highlightBlochArea(current_bloch_index);
    return blochs[current_bloch_index];
}

function exec(input) {
    var tokens = input.split(" ");
    if (tokens[0]) {
        if (isQubit(tokens[0]) && tokens[1] == "=") {
            tokens[1] = "copy";
            commands[tokens[1]](tokens[0], tokens.slice(2));
        } else {
            var qubit = commands[tokens[0]](tokens.slice(1));
            if (qubit) {
                var bloch = getNextBloch();
                if (bloch) {
                    bloch.blochPlot(qubit);
                    bloch.blochRender();
                }
            }
        }
    }
}
