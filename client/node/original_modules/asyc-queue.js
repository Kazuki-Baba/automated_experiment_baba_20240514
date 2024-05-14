var Latch = function(){
    this._subscribers = [];
  };
  Latch.prototype = {
    notify: function() {
      var s = this._subscribers.shift();
      if (s) {
        s();
      }
    },
    add: function(s) {
      this._subscribers.push(s);
    }
  };
  
  // 非同期キュー
  //   max: キュー要素の上限数
  var AsyncQueue = function(max) {
    this.max = max || 0;
    this._q = [];
    this._underMax = new Latch();
    this._notEmpty = new Latch();
  };
  AsyncQueue.prototype = {
  
    // キューに新たな要素を追加する。
    // キュー要素数が max に達していた場合、要素の追加は要素の数が減るまでペンディングされる。
    // 第2引数は要素追加時に呼ばれる関数。
    enqueue: function(e, callback) {
      var q = this;
      var f = function() {
        q._q.push(e);
        if (callback) {
          callback();
        }
        q._notEmpty.notify();
      };
  
      if (this.max <= 0 || this.getSize() < this.max) {
        f();
      } else {
        this._underMax.add(f);
      }
  
      return this;
    },
  
    // キューから要素を取得し、その要素を callback の引数に与え実行する。
    // キューが空の場合は、キューに要素が追加されるまで callback の実行がペンディングされる。
    dequeue: function(callback) {
      var q = this;
      var f = function() {
        var e = q._q.shift();
        if (callback) {
          callback(e);
        }
        if (q.max <= 0 || q.getSize() < q.max) {
          q._underMax.notify();
        }
      };
  
      if (this.getSize() > 0) {
        f();
      } else {
        this._notEmpty.add(f);
      }
  
      return this;
    },
    getSize: function() {
      return this._q.length;
    }
  };
  

  var Worker = function(queue) {
    // タスクでキャッチされなかった例外を処理するための関数。
    // 第1引数にエラーオブジェクトを与えられ、返値は処理を継続するかどうかのフラグを期待する。
    this.errorHandler = function() { return true; };
  
    // 処理を継続するか否かのフラグ
    this.isContinue = true;
  
    var w = this;
    var next = function() {
      queue.dequeue(function(task) {
        if (!w.isContinue) {
          return;
        }
  
        try {
          task(next);
        } catch(e) {
          if (w.errorHandler(e)) {
           next();
          }
        }
      });
    };
    next();
  };


  exports.AsyncQueue = AsyncQueue;
  exports.Worker = Worker;
  exports.Latch = Latch;