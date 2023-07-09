import React from 'react';
import useTdesignComp from '../hooks/useTdesignComp';

function LazyLoadDemo(props: any) {
  const Tabs = useTdesignComp('Tabs');
  const Button = useTdesignComp('Button');
  console.log(Tabs, Button);

  return <Tabs
    addable={false}
    defaultValue="1"
    disabled={false}
    dragSort={false}
    placement="top"
    size="medium"
    theme="normal"
  >
    <Tabs.TabPanel
      destroyOnHide
      disabled={false}
      label="选项卡1"
      removable={false}
      value="1"
    >
      <div style={{ margin: 20 }}>
        选项卡1内容区
        <Button> shadow button 1-1</Button>
        <Button> shadow button 1-2</Button>
      </div>
    </Tabs.TabPanel>
    <Tabs.TabPanel
      destroyOnHide
      disabled={false}
      label="选项卡2"
      removable={false}
      value="2"
    >
      <div style={{ margin: 20 }}>
        选项卡2内容区
        <Button> shadow button 2-1</Button>
        <Button> shadow button 2-2</Button>
      </div>
    </Tabs.TabPanel>
  </Tabs>;
}

export default LazyLoadDemo;
