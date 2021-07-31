import React from "./my_node_moudles/react";
import Component from "./my_node_moudles/react/Component";
import ReactDOM, { useState } from "./my_node_moudles/react/reactDom";
import "./index.css";

function FunctionComponnet(props) {
  const { name } = props;
  const [showButton, setShowButton] = useState(false);
  const [number, setNumber] = useState(0);

  return (
    <div className="function-comp">
      FunctionComponnet - {name}
      <button onClick={() => setShowButton(!showButton)}>
        toggle-show-button
      </button>
      {showButton ? (
        <button
          className="button"
          onClick={() => {
            setNumber(Math.floor(Math.random() * 100));
            setNumber("suprise mother F!!!")
            setNumber("what a sunny day")
          }}
        >
          点击改变数字 {number}
        </button>
      ) : (
        <div>omg</div>
      )}
    </div>
  );
}

class ClassComponent extends Component {
  static defaultProps = {
    name: "郑顶针",
  };

  render() {
    const { name } = this.props;
    return (
      <div className="class-comp">
        <div className={name}>ClassComponent --- {name}</div>
      </div>
    );
  }
}

const renderJsx = (
  <div className="jsx-container">
    <p className="item ">这是一个P标签</p>
    <a href="https://www.baidu.com">点击跳转</a>
    <div className="borer">
      <h5>这里是一个H5标签</h5>
    </div>
    <FunctionComponnet name="郑树森" />
    <ClassComponent />
    <>Fragment</>
  </div>
);

ReactDOM.render(renderJsx, document.getElementById("root"));
