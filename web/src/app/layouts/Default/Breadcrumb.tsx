import React from 'react';
import { Breadcrumb as AntdBreadCrumb } from 'antd';

export default function Breadcrumb() {
  return (
    <AntdBreadCrumb style={{ margin: '16px 0' }}>
      <AntdBreadCrumb.Item>Home</AntdBreadCrumb.Item>
      <AntdBreadCrumb.Item>List</AntdBreadCrumb.Item>
      <AntdBreadCrumb.Item>App</AntdBreadCrumb.Item>
    </AntdBreadCrumb>
  );
}
