// import React from "react";
// import ReactDOM from "react-dom";
import React from "./my-react";

import ReactDOM from "./my-react/ReactDOM";
import Component from "./my-react/Component";
import "./index.css";

function FunctionComponent({ name }) {
  return (
    <div className="border function">
      hello, {name} 857-857
      <button onClick={() => console.log("omg")}>click</button>
    </div>
  );
}

//继承自React.Component
class ClassComponent extends Component {
  render() {
    const { name } = this.props;
    return (
      <div className="border function">
        hello, {name}
        <div>
          <span>支持无限嵌套</span>
        </div>
      </div>
    );
  }
}

const jsx = (
  <div className="border">
    <p>这是一个文本</p>
    <a href="https://github.com/panda-611130/react-ecology">
      其他仿写
    </a>
    <div className="border">
      <h5>hello</h5>
    </div>
    <FunctionComponent name="function" />
    <ClassComponent name="class" />
    {/* 这种节点会的虚拟dom的 type 为 undefined */}
    <>
      <h5>文本1</h5>
      <h5>文本2</h5>
    </>

    {[1, 2, 3].map((item) => {
      return (
        <div className="border" key={item}>
          <p>{item}--name</p>
          <p>{item}</p>
        </div>
      );
    })}
  </div>
);

//  ========= ********* ========== 
// 因为有babel会编译JSX,所以一般很少会直接调用这个方法.
// jsx babel会自动调用React中 createElement 这个方法 将jsx通过CreateElement转换为Vnode！！！！所以有jsx 就要有React的引入
// ========= ********* ==========
// vnode->node , 把node渲染更新到container
// ReactDOM.render 将虚拟DOM 转换为真实的DOM并且展示在浏览器上面

console.log("=== jsx ===", jsx);
ReactDOM.render(jsx, document.getElementById("root"));

// !节点类型
// 文本节点
// html标签节点
// class componet
// function component
// fragment
// jsx ====babel=====> 
//                  createElement(生成element，就是我们需要的虚拟dom)
//                   ===>render(vnode->node, 再把node渲染到container)
// vnode->node的流程注意下节点的区分，不同节点处理方式不同
