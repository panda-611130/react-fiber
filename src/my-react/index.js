//!vnode 就代表虚拟dom节点
//! node代表真实dom节点

// 思考为什么有jsx的地方需要引入react 就明白了这个 createElement 的调用时机 实际直接可以在index.js文件中log以下jsx
// 接收type, props, children， 返回一个vnode
function createElement(type, props, ...children) {
  if (props) {
    delete props.__source;
    delete props.__self;
  }

  return {
    type: type,
    props: {
      ...props,
      //!这里的处理与源码稍有不同，源里的话，只有一个元素，children是对象，多于一个的时候，是数组
      children: children.map((child) =>
        typeof child === "object" ? child : createTextNode(child)
      ),
    },
  };
}

function createTextNode(text) {
  return {
    type: "TEXT",
    props: {
      children: [], // 有孩子的话放在这里面，似乎和nodeValue 必有一个是空的
      nodeValue: text, //有文本的话存储在这个里面
    },
  };
}
export default {
  createElement,
};
