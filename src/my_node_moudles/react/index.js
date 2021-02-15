/**
 * 核心：存在jsx的文件中引入 React后 babel会自动调用createElement 方法 将我们写的jsx转换为 vdom
 * @param {*} type
 * @param {*} props
 * @param  {...any} children
 */
function createElement(type, props, ...children) {
  if (props) {
    //删除一些固有属性
    delete props.__source;
    delete props.__self;
  }

  //默认属性设置
  let defaultProps = {};
  if (type && type.defaultProps) {
    defaultProps = { ...type.defaultProps };
  }
  return {
    type: type,
    props: {
      ...defaultProps,
      ...props,
      //!这里的处理与源码稍有不同，源里的话，只有一个元素，children是对象，多于一个的时候，是数组
      children: children.map((child) => {
        return typeof child === "object" ? child : createTextNode(child);
      }),
    },
  };
}

function createTextNode(text) {
  return {
    type: "TEXT",
    props: {
      children: [],
      nodeValue: text,
    },
  };
}

export default {
  createElement,
};
