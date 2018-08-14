(function(A, E) {
    var c, ctx;
    
    Array.prototype.smartPush = function(a) {
        var b = this.indexOf(a);
        return -1 == b ? (this.push(a), !0) : !1;
    };
    
    Array.prototype.pushLine = function(line) {
        if (line[0] != line[2] || line[1] != line[3]) {
            usr.lines.smartPush(line);
        }
    };
    
    var usr = {
        scale: 1,
        tool: 1,
        lines: [],
        cancelled: [],
        undo: function() {
            var l = usr.lines.pop();
            if (l) usr.cancelled.smartPush(l);
            A.requestAnimationFrame(animate);
        },
        redo: function() {
            var l = usr.cancelled.pop();
            if (l) usr.lines.smartPush(l);
            A.requestAnimationFrame(animate);
        },
        initX: 0,
        initY: 0,
        scrX: 0,
        scrY: 0,
    };
    
    var mouse = {
        x: 0,
        y: 0,
        realX: 0,
        realY: 0,
        stepX: 0,
        stepY: 0,
        set: function(evt) {
            if (evt.offsetX) {
                this.x = evt.offsetX;
                this.y = evt.offsetY;
            } else if (evt.layerX) {
                this.x = evt.layerX;
                this.y = evt.layerY;
            }
            this.realX = descale.x(this.x);
            this.realY = descale.y(this.y);
            this.stepX = scale.x(this.realX);
            this.stepY = scale.y(this.realY);
        }
    };
    
    var bg = {
        image: new Image(),
        tmpImg: new Image(),
        setSrc: function(src) {
            this.tmpImg.src = src;
            this.tmpImg.onload = () => {
                this.image.src = src;
                this.image.onload = () => A.requestAnimationFrame(animate);
            };
            this.tmpImg.onerror = (err) => console.error("Image not found!");
        },
        name: null,
        show: true,
        opacity: 0.5,
        fit: true,
        ratio: true,
        scale: 1.0,
        shiftX: 0,
        shiftY: 0,
    };
    
    var line = [];
    
    var Tools = [
        {
            name: "cursor",
            icon: (function() {
                var img = new Image();
                img.src = "icons/cursor.png";
                return img;
            })(),
            msDown: function() {
                usr.initX = mouse.realX;
                usr.initY = mouse.realY;
            },
            msUp: function() {},
            msMove: function() {},
            animation: function() {
                ctx.globalAlpha = 1;
                ctx.drawImage(Tools[0].icon, mouse.stepX, mouse.stepY);
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#FF0000";
                ctx.beginPath();
                ctx.moveTo(mouse.stepX, 0);
                ctx.lineTo(mouse.stepX, 600);
                ctx.moveTo(0, mouse.stepY);
                ctx.lineTo(800, mouse.stepY);
                ctx.stroke();
                ctx.restore();
            }
        },
        {
            name: "pencil",
            icon: (function() {
                var img = new Image();
                img.src = "icons/pencil.png";
                return img;
            })(),
            isDrawing: false,
            lastLineAt: 0,
            msDown: function() {
                this.isDrawing = true;
                line[2] = mouse.realY;
                line[3] = mouse.realX;
            },
            msUp: function() {
                this.isDrawing = false;
                line = [];
            },
            msMove: function() {
                if (this.isDrawing) {
                    var x = mouse.realX;
                    var y = mouse.realY;
                    var now = Date.now();
                    if ((x != line[2] || y != line[3]) && now - this.lastLineAt > 50) {
                        var lastLine = usr.lines[usr.lines.length - 1];
                        if (lastLine) {
                            if ((derivative(x, y, line[3], line[2]) === derivative(lastLine[1], lastLine[0], lastLine[3], lastLine[2])) &&
                                (lastLine[1] == line[3] && lastLine[0] == line[2])) {
                                usr.lines[usr.lines.length - 1][0] = y;
                                usr.lines[usr.lines.length - 1][1] = x;
                            } else usr.lines.pushLine([y, x, line[2], line[3]]);
                        } else usr.lines.pushLine([y, x, line[2], line[3]]);
                        line[2] = y;
                        line[3] = x;
                        this.lastLineAt = now;
                    }
                }
            },
            animation: function() {
                if (usr.scale > 4) {
                    ctx.strokeStyle = "#FF0000";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(mouse.stepX, mouse.stepY, 5, 0, 2*Math.PI);
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.globalAlpha = 1;
                ctx.drawImage(this.icon, mouse.x - 7, mouse.y - 44);
            }
        },
        {
            name: "line",
            icon: (function() {
                var img = new Image();
                img.src = "icons/pencil.png";
                return img;
            })(),
            isDrawing: false,
            msDown: function(evt) {
                if (evt.which == 3 || evt.button == 2) {
                    evt.preventDefault();
                    this.isDrawing = false;
                    line = [];
                } else {
                    if (this.isDrawing) {
                        var x = mouse.realX;
                        var y = mouse.realY;
                        if (x != line[2] || y != line[3]) {
                            usr.lines.smartPush([y, x, line[2], line[3]]);
                            line[2] = y;
                            line[3] = x;
                        }
                    } else {
                        line[2] = mouse.realY;
                        line[3] = mouse.realX;
                        this.isDrawing = true;
                    }
                }
            },
            msUp: function() {},
            msMove: function() {},
            animation: function() {
                if (this.isDrawing) {
                    ctx.globalAlpha = 0.5;
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#FF0000";
                    ctx.beginPath();
                    ctx.moveTo(scale.x(line[3]) - 0.5, scale.y(line[2]) - 0.5);
                    ctx.lineTo(mouse.stepX - 0.5, mouse.stepY - 0.5);
                    ctx.stroke();
                    ctx.restore();
                } else if (usr.scale > 4) {
                    ctx.strokeStyle = "#FF0000";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(mouse.stepX, mouse.stepY, 5, 0, 2*Math.PI);
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.globalAlpha = 1;
                ctx.drawImage(this.icon, mouse.x - 7, mouse.y - 44);
            }
        },
        {
            name: "scale",
            icon: (function() {
                var img = new Image();
                img.src = "icons/scale.png";
                return img;
            })(),
            newX: 0,
            newY: 0,
            msDown: function(evt) {
                var dir = 1;
                if (evt.which == 3 || evt.button == 2) {
                    evt.preventDefault();
                    if (usr.scale > 1) {
                        usr.scale /= 2;
                        usr.scrX -= 400/usr.scale;
                        usr.scrY -= 300/usr.scale;
                    }
                    if (usr.scrX < 0) usr.scrX = 0;
                    if (usr.scrY < 0) usr.scrY = 0;
                } else {
                    if (usr.scale < 16) {
                        usr.scale *= 2;
                        usr.scrX += 2*this.newX/usr.scale;
                        usr.scrY += 2*this.newY/usr.scale;
                    }
                }
            },
            msUp: function() {},
            msMove: function() {
                this.newX = Math.max(mouse.x - 200, 0);
                if (this.newX > 400) this.newX = 400;
                this.newY = Math.max(mouse.y - 150, 0);
                if (this.newY > 300) this.newY = 300;
            },
            animation: function() {
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#FF0000";
                ctx.beginPath();
                var x = this.newX;
                var y = this.newY;
                ctx.moveTo(x, y);
                ctx.lineTo(x + 400, y);
                ctx.moveTo(x, y + 300);
                ctx.lineTo(x + 400, y + 300);
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 300);
                ctx.moveTo(x + 400, y);
                ctx.lineTo(x + 400, y + 300);
                ctx.stroke();
                ctx.restore();
                ctx.globalAlpha = 1;
                ctx.drawImage(this.icon, mouse.x - 20, mouse.y - 20);
                ctx.font = "16px NovaSquare";
                var text = "x" + usr.scale;
                var b = ctx.measureText(text).width/2;
                ctx.fillText(text, mouse.x - b, mouse.y + 5);
            }
        },
        {
            name: "erase",
            icon: (function() {
                var img = new Image();
                img.src = "icons/del2.png";
                return img;
            })(),
            lineIndex: null,
            msDown: function() {
                if (this.lineIndex != null) {
                    var l = usr.lines.splice(this.lineIndex, 1)[0];
                    usr.cancelled.push(l);
                    this.lineIndex = null;
                }
            },
            msUp: function() {},
            msMove: function() {
                this.lineIndex = getLineByCoords(mouse.realX, mouse.realY);
            },
            animation: function() {
                ctx.globalAlpha = 1;
                if (this.lineIndex != null) {
                    ctx.strokeStyle = "#FF0000";
                    ctx.lineWidth = scale.all(1);
                    ctx.beginPath();
                    ctx.lineJoin = ctx.lineCap = 'round';
                    var l = usr.lines[this.lineIndex];
                    ctx.moveTo(scale.x(l[1]) - 0.5, scale.y(l[0]) - 0.5);
                    ctx.lineTo(scale.x(l[3]) - 0.5, scale.y(l[2]) - 0.5);
                    ctx.stroke();
                }
                ctx.drawImage(this.icon, mouse.x - 10, mouse.y - 25, this.icon.width/1.5, this.icon.height/1.5);
            }
        }
    ];
    
    function getLineByCoords(x, y) {
        var c, dist, l, ind = null, minDist = Infinity;
        for (var i = 0; i < usr.lines.length; i++) {
            l = usr.lines[i];
            dist = getDist(y, x, l[0], l[1]) + getDist(y, x, l[2], l[3]);
            c = getDist(l[0], l[1], l[2], l[3]);
            if (dist < c + 2 + 10/c) {
                dist -= c; 
                if (dist < minDist) {
                    ind = i;
                    minDist = dist;
                } 
            }
        }
        return ind;
    }
    
    function getDist(y1, x1, y0, x0) {
        return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    }
    
    function stopDrawing() {
        for (var i = 0; i < Tools.length; i++) {
            if (Tools[i].hasOwnProperty("isDrawing"))
                Tools[i].isDrawing = false;
        }
        line = [];
    }
    
    function getLines() {
        var corrLines = [];
        var x0 = usr.initX;
        var y0 = usr.initY;
        var l, j;
        for (var i = 0; i < usr.lines.length; i++) {
            l = usr.lines[i];
            corrLines.push([
                l[0] - y0,
                l[1] - x0,
                l[2] - y0,
                l[3] - x0
            ]);
        }
        return corrLines;
    }
    
    function setLines(lines, x, y) {
        usr.lines = [];
        var extrPoints = [y, 0, x, 0];
        if (!x || !y) {
            extrPoints = getSizesOfLines(lines);
            if (extrPoints[2] > 0) extrPoints[2] = 0;
            if (extrPoints[0] > 0) extrPoints[0] = 0;
            usr.initX = Math.abs(extrPoints[0]);
            usr.initY = Math.abs(extrPoints[2]);
        }
        var l;
        for (var i = 0; i < lines.length; i++) {
            l = lines[i];
            usr.lines.push([
                l[0] - extrPoints[2],
                l[1] - extrPoints[0],
                l[2] - extrPoints[2],
                l[3] - extrPoints[0]
            ]);
        }
    }
    
    function derivative(x1, y1, x0, y0) {
        if (x1 == x0) return false;
        return Number(((y1 - y0) / (x1 - x0)).toFixed(1));
    }
    
    function getSizesOfLines(lines) { // getting [xMin, xMax, yMin, yMax]
        return lines.reduce(function(res, line) {
            res[0] = Math.min(line[1], line[3], res[0]);
            res[1] = Math.max(line[1], line[3], res[1]);
            res[2] = Math.min(line[0], line[2], res[2]);
            res[3] = Math.max(line[0], line[2], res[3]);
            return res;
        }, [+Infinity, -Infinity, +Infinity, -Infinity]);
    }
    
    var scale = {
        x: function(a) {
            return ((a << 1) - usr.scrX)*usr.scale;
        },
        y: function(a) {
            return ((a << 1) - usr.scrY)*usr.scale;
        },
        all: function(a) {
            return a*usr.scale;
        }
    };
    
    var descale = {
        x: function(a) {
            return Math.round((a/usr.scale + usr.scrX) >> 1);
        },
        y: function(a) {
            return Math.round((a/usr.scale + usr.scrY) >> 1);
        }
    };
    
    function animate() {
        ctx.clearRect(0, 0, 800, 600);
        if (bg.show) {
            ctx.globalAlpha = bg.opacity;
            if (bg.fit) {
                if (bg.ratio) {
                    var scaler = Math.min(800/bg.image.width, 600/bg.image.height);
                    ctx.drawImage(bg.image, scale.x(bg.shiftX), scale.y(bg.shiftY), scale.all(bg.image.width*scaler), scale.all(bg.image.height*scaler));
                } else ctx.drawImage(bg.image, scale.x(bg.shiftX), scale.y(bg.shiftY), scale.all(800), scale.all(600));
            } else ctx.drawImage(bg.image, scale.x(bg.shiftX), scale.y(bg.shiftY), scale.all(bg.image.width*bg.scale), scale.all(bg.image.height*bg.scale));
        }
        ctx.strokeStyle = ctx.fillStyle = "#000000";
        ctx.globalAlpha = 1;
        ctx.lineWidth = scale.all(1);
        ctx.save();
        ctx.beginPath();
        ctx.lineJoin = ctx.lineCap = 'round';
        var l;
        for (var i = usr.lines.length; i--; ) {
            if (usr.tool == 4 && i == Tools[4].lineIndex) continue;
            l = usr.lines[i];
            ctx.moveTo(scale.x(l[1]) - 0.5, scale.y(l[0]) - 0.5);
            ctx.lineTo(scale.x(l[3]) - 0.5, scale.y(l[2]) - 0.5);
        }
        ctx.stroke();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(Tools[0].icon, scale.x(usr.initX), scale.y(usr.initY), scale.all(Tools[0].icon.width), scale.all(Tools[0].icon.height));
        Tools[usr.tool].animation();
    }
    
    function handleFile(f) {
        f = f.target.result;
        var lines;
        var x, y;
        var p = f.indexOf("CursorPosition: ");
        if (p != -1) {
            var c = f.indexOf(", ");
            var sub = f.substring(p + 16, c);
            y = Number(sub);
            sub = f.substring(c + 2, f.indexOf("\n"));
            x = Number(sub);
            usr.initX = x;
            usr.initY = y;
        }
        p = f.indexOf("[");
        f = f.substring(p);
        p = f.indexOf(";");
        if (p != -1) {
            f = f.slice(0, p);
        }
        try {
            lines = JSON.parse(f);
        } catch (err) {
            console.error("Incorrect file: ", err);
        }
        if (lines) {
            setLines(lines, -x, -y);
            A.requestAnimationFrame(animate);
        }
    }
    
    function downloadTxt() {
        var element = E.createElement('a');
        element.setAttribute('href', 
                             'data:text/plain;charset=utf-8,' + encodeURIComponent(
                                 JSON.stringify(getLines())
                                ));
        element.setAttribute('download', "my draw.txt");
        element.style.display = 'none';
        E.body.appendChild(element);
        element.click();
        E.body.removeChild(element);
    }
    
    function validateInputValueChange(inputId) {
        switch (inputId) {
            case "bgOpacityInput":
                bg.opacity = validateValue(bgOpacityInput.value, bg.opacity, 0, 1);
                bgOpacityInput.value = bg.opacity;
                break;
            case "bgScaleInput":
                bg.scale = validateValue(bgScaleInput.value, bg.scale, -Infinity, +Infinity);
                bgScaleInput.value = bg.scale;
                break;
            case "bgShiftXInput":
                bg.shiftX = validateValue(bgShiftXInput.value, bg.shiftX, -Infinity, +Infinity);
                bgShiftXInput.value = bg.shiftX;
                break;
            case "bgShiftYInput":
                bg.shiftY = validateValue(bgShiftYInput.value, bg.shiftY, -Infinity, +Infinity);
                bgShiftYInput.value = bg.shiftY;
                break;    
        }
    }
    
    function validateValue(inputVal, varToChange, min, max) {
        if (isNumeric(inputVal)) {
            var val = Number(inputVal);
            if (val >= min && val <= max)
                return val;
        }
        return varToChange;
    }
    
    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    
    function prepCanvas() {
        c = E.getElementById("canvas");
        ctx = c.getContext("2d");
        c.onmousemove = function(evt) {
            mouse.set(evt);
            Tools[usr.tool].msMove(evt);
            A.requestAnimationFrame(animate);
        };
        c.onmousedown = function(evt) {
            mouse.set(evt);
            Tools[usr.tool].msDown(evt);
            A.requestAnimationFrame(animate);
        };
        c.onmouseup = function(evt) {
            mouse.set(evt);
            Tools[usr.tool].msUp(evt);
            A.requestAnimationFrame(animate);
        };
        c.onmouseout = stopDrawing;
    }
    
    function prepTools() {
        var toolButtons = E.getElementsByClassName("tools");
        for (var i = 0; i < toolButtons.length; i++) {
            let number = i;
            toolButtons[number].onclick = function() {
                for (var i = 0; i < toolButtons.length; i++) {
                    toolButtons[i].classList.remove("active");
                }
                toolButtons[number].classList.add("active");
                usr.tool = number;
                A.requestAnimationFrame(animate);
            };
        }
    }
    
    function prepNumbersUI() {
        var inputNumberUI = E.getElementsByClassName("inputNumberUI");
        for (var i = 0; i < inputNumberUI.length; i++) {
            if (i == 1) inputNumberUI[1].parentElement.style.display = "none";
            let n = i;
            inputNumberUI[i].onmouseover = function() {inputNumberUI[n].focus();};
            inputNumberUI[i].onmouseout = function() {inputNumberUI[n].blur();};
            inputNumberUI[i].onkeypress = function(evt) {
                evt.stopPropagation(); 
                if ((evt.which || evt.keyCode) == 13) 
                    inputNumberUI[n].blur();
            };
            inputNumberUI[i].onchange = function() {
                validateInputValueChange(inputNumberUI[n].id);
                A.requestAnimationFrame(animate);
            };
        }
        var bgFitInput = E.getElementById("bgFitInput");
        var bgRatioInput = E.getElementById("bgRatioInput");
        bgFitInput.onchange = function() {
            bg.fit = !bg.fit;
            if (bg.fit) {
                bgRatioInput.parentElement.style.display = "";
                inputNumberUI[1].parentElement.style.display = "none";
            } else {
                bgRatioInput.parentElement.style.display = "none";
                inputNumberUI[1].parentElement.style.display = "";
            }
            A.requestAnimationFrame(animate);
        };
        bgRatioInput.onchange = function() {
            bg.ratio = !bg.ratio;
            A.requestAnimationFrame(animate);
        };
    }
    
    function prepButtons() {
        var confButton = E.getElementById("confirm");
        var plhd = E.getElementById("placeholder");
        confButton.onclick = function() {
            confButton.onclick = null;
            plhd.style.display = "";
            c.style.display = "";
        };
        var cont2 = E.getElementById("cont2");
        var aboutButton = E.getElementById("about");
        aboutButton.onclick = function() {
            var disp = cont2.style.display;
            if (disp == "") cont2.style.display = "block";
            else cont2.style.display = "";
        };
        var imageButton = E.getElementById("imageButton");
        imageButton.onclick = function(evt) {
            bg.show = !bg.show;
            evt.currentTarget.style.display = "none";
            var img = evt.currentTarget.getElementsByTagName("img")[0];
            var controls = E.getElementById("imageControls");
            if (bg.show) {
                img.src = "icons/image.png";
                controls.style.display = "";
            } else {
                img.src = "icons/imageNo.png";
                controls.style.display = "none";
            }
            evt.currentTarget.style.display = "";
            A.requestAnimationFrame(animate);
        };
        var undoButton = E.getElementById("undoButton");
        undoButton.onclick = usr.undo;
        var redoButton = E.getElementById("redoButton");
        redoButton.onclick = usr.redo;
        var saveButton = E.getElementById("saveButton");
        saveButton.onclick = downloadTxt;
    }
    
    function prepDnd() {
        var confButton = E.getElementById("confirm");
        A.addEventListener('dragover', function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        }, false);
        A.addEventListener('drop', function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            confButton.click();
            var files = evt.dataTransfer.files;
            if (files.length == 0) {
                bg.setSrc(evt.dataTransfer.getData('text/uri-list'));
                return;
            }
            var gotImage = false, gotLines = false;
            var f;
            for (var i = 0; i < files.length; i++) {
                f = files[i];
                if (!gotImage && f.type.match('image.*')) {
                    let reader = new FileReader();
                    bg.name = f.name;
                    reader.onload = function(evt) {
                        bg.setSrc(evt.target.result);
                    };
                    reader.readAsDataURL(f);
                    gotImage = true;
                } else if (!gotLines && ((f.type.match('text.*')) || f.type.match('application/javascript'))) {
                    let reader = new FileReader();
                    bg.name = f.name;
                    reader.onload = handleFile;
                    reader.readAsText(f);
                    gotLines = true;
                } else continue;
            }
        }, false);
    }
    
    function init() {
        prepCanvas();
        prepTools();
        prepNumbersUI();
        prepButtons();
        prepDnd();
        A.requestAnimationFrame(animate);
    }
    E.body.onload = init;
})(window, document);