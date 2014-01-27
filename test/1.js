$B.modules.declare("Test.C", [""], function () {//模块具体实现
	$B.modules.use(["Test.A|3.js", "Test.B|2.js"],function(){
		alert(Test.A.a+"11");
	})
    this.c = "c";
});