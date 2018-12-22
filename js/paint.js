$(document).ready(function () {
    var modal = {
        template: '#modal-template',
        data: function () {
            return {
            }
        }
    };

    var vue = new Vue({
        el: '#canvasVue',
        data: {
            penType: 'black',
            isDrawing: false,
            strokeCount: 0,
            brushSize: 2,
            pressureNum: 3,
            showModal: false
        },
        components: {
            'modal': modal
        },
        computed: {
            updateBrushSizeView: function () {
                if(brushSizeViewCanvasContext) {
                    brushSizeViewCanvasContext.fillStyle = 'rgb(255, 255, 255)';
                    brushSizeViewCanvasContext.fillRect(0, 0, canvas.width, canvas.height);
                    brushSizeViewCanvasContext.beginPath();
                    brushSizeViewCanvasContext.fillStyle = 'rgb(0, 0, 0)';
                    brushSizeViewCanvasContext.arc(12, 12, this.$data.brushSize / 2, 0, Math.PI*2, false);
                    brushSizeViewCanvasContext.fill();
                }
                return this.$data.brushSize;
            }
        },
        methods: {
            changePenType: function () {
                if (this.penType === 'color') {
                    this.penType = 'black';
                    return;
                }
                this.penType = 'color';
            },
            showModalButtonClick: function () {
                this.showModal = true;
                this.$nextTick(function () {
                    $('[data-image]').attr('src', canvas.toDataURL());
                })
            }
        }
    });

    var fromCoordinate = {
        x: 0,
        y: 0
    };

    var canvas = $('[data-canvas]').get(0);
    canvas.width = 800; // デフォルトではDOM要素のサイズと一致しないので指定が必要
    canvas.height = 600;
    var context = canvas.getContext('2d');

    var brushSizeViewCanvas = $('[data-brush-size-view]').get(0);
    brushSizeViewCanvas.width = 24;
    brushSizeViewCanvas.height = 24;
    var brushSizeViewCanvasContext = brushSizeViewCanvas.getContext('2d');

    brushSizeViewCanvasContext.fillStyle = 'rgb(255, 255, 255)';
    brushSizeViewCanvasContext.fillRect(0, 0, canvas.width, canvas.height);
    brushSizeViewCanvasContext.beginPath();
    brushSizeViewCanvasContext.fillStyle = 'rgb(0, 0, 0)';
    brushSizeViewCanvasContext.arc(12, 12, vue.$data.brushSize / 2, 0, Math.PI*2, false);
    brushSizeViewCanvasContext.fill();

    var rgba = getRGBA(vue.$data.penType);
    loadCanvas();

    function loadCanvas() {
        // 前回のキャンバスサイズ設定があれば読み込み、なければ背景をfill
        var canvasWidth = window.localStorage.getItem("canvasWidth");
        var canvasHeight = window.localStorage.getItem("canvasHeight");
        if(canvasWidth) {
            canvas.width = canvasWidth;
        }
        if(canvasHeight) {
            canvas.height = canvasHeight;
        }

        // 前回の描画内容があれば読み込み、なければ背景をfill
        var base64 = window.localStorage.getItem("canvas");
        if (base64) {
            var image = new Image();
            image.src = base64;
            image.onload = function () {
                context.drawImage(image, 0, 0);
            }
        } else {
            context.fillStyle = 'rgb(255, 255, 255)';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 保存されたストロークカウントを読み込み
        var savedStrokedCount = window.localStorage.getItem("strokeCount");
        if (savedStrokedCount) {
            vue.$data.strokeCount = parseInt(savedStrokedCount);
        }
    }

    function saveCanvas() {
        window.localStorage.setItem("canvas", canvas.toDataURL());
        window.localStorage.setItem("strokeCount", vue.$data.strokeCount);
        window.localStorage.setItem("canvasWidth", canvas.width);
        window.localStorage.setItem("canvasHeight", canvas.height);
    }

    function setCanvasSize(width, height) {
        canvas.width = width;
        canvas.height = height;
        window.localStorage.setItem("canvasWidth", width);
        window.localStorage.setItem("canvasHeight", height);
    }

    function clearCanvas() {
        context.fillStyle = 'rgb(255, 255, 255)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        vue.$data.strokeCount = 0;
        saveCanvas();
    }

    function drawStart(e) {
        // スクロールさせない
        e.preventDefault();
        vue.$data.isDrawing = true;

        var isTouch = getIsTouch(e);
        var toCoordinate = getCoordinate(e, isTouch);
        fromCoordinate.x = toCoordinate.x;
        fromCoordinate.y = toCoordinate.y;

        rgba = getRGBA(vue.$data.penType);
        drawLine(e, isTouch, context, fromCoordinate, toCoordinate);

        vue.$data.strokeCount++;
    }

    function drawEnd() {
        vue.$data.isDrawing = false;
        saveCanvas();
    }

    function drawMove(e) {
        if (!vue.$data.isDrawing) {
            return;
        }

        var isTouch = getIsTouch(e);
        var toCoordinate = getCoordinate(e, isTouch);
        drawLine(e, isTouch, context, fromCoordinate, toCoordinate);

        fromCoordinate.x = toCoordinate.x;
        fromCoordinate.y = toCoordinate.y;
    }

    function drawLine(e, isTouch, context, fromCoordinate, toCoordinate) {
        context.strokeStyle = "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")";
        context.lineWidth = getLineWidth(e, isTouch);
        context.lineJoin = "round";
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(fromCoordinate.x, fromCoordinate.y);
        context.lineTo(toCoordinate.x, toCoordinate.y);
        context.stroke();
        context.closePath();
    }

    function getLineWidth(e, isTouch) {
        var brushSize = vue.$data.brushSize;
        if (isTouch && (vue.$data.pressureNum !== 0)) {
            brushSize = brushSize * e.touches[0].force * vue.$data.pressureNum;
        }
        return brushSize;
    }

    function getIsTouch(e) {
        var isTouch = true;
        if (e.touches === undefined) {
            isTouch = false;
        }
        return isTouch;
    }

    function getRGBA(penType) {
        var rgba = {r: 0, g: 0, b: 0, a: 1.0};
        if (penType === "color") {
            rgba.r = Math.floor(Math.random() * 255);
            rgba.g = Math.floor(Math.random() * 255);
            rgba.b = Math.floor(Math.random() * 255);
        }
        return rgba;
    }

    function getCoordinate(e, isTouch) {
        var x = 0;
        var y = 0;
        var rect = e.target.getBoundingClientRect();

        if (isTouch) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        return {x: x, y: y};
    }

    $(canvas).on('mousedown', function (e) {
        drawStart(e);
    });
    $(canvas).on('mousemove', function draw(e) {
        drawMove(e);
    });
    $(canvas).on('mouseup', function (e) {
        drawEnd(e);
    });

    $(canvas).on('touchstart', function (e) {
        drawStart(e);
    });
    $(canvas).on('touchmove', function draw(e) {
        drawMove(e);
    });
    $(canvas).on('touchend', function (e) {
        drawEnd(e);
    });

    $('[data-set-canvas-size-default]').on('click', function (event) {
        event.preventDefault();
        if (!confirm('キャンバスサイズを変更します(全消しされます)。よろしいですか？')) {
            return false;
        }
        setCanvasSize(800, 600);
        clearCanvas();
    });

    $('[data-set-canvas-size-horizontal-background]').on('click', function (event) {
        event.preventDefault();
        if (!confirm('キャンバスサイズを変更します(全消しされます)。よろしいですか？')) {
            return false;
        }
        setCanvasSize(800, 600);
        clearCanvas();

        var backgroundImg = new Image();
        backgroundImg.src = "./images/background.png";
        backgroundImg.onload = function() {
            context.drawImage(backgroundImg,0,0, 800, 600);
        };
    });

    $('[data-set-canvas-size-vertical]').on('click', function (event) {
        event.preventDefault();
        if (!confirm('キャンバスサイズを変更します(全消しされます)。よろしいですか？')) {
            return false;
        }
        setCanvasSize(500, 900);
        clearCanvas();
    });

    $('[data-all-clear]').on('click', function (event) {
        event.preventDefault();
        if (!confirm('全消しします。よろしいですか？')) {
            return false;
        }
        clearCanvas();
    });
});
