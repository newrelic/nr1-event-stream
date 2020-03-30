export const rowRenderer = (data, events) => {
  let {
    className,
    columns,
    index,
    key,
    onRowClick,
    onRowDoubleClick,
    onRowMouseOut,
    onRowMouseOver,
    onRowRightClick,
    rowData,
    style,
  } = data;

  const a11yProps = { 'aria-rowindex': index + 1 };

  if (
    onRowClick ||
    onRowDoubleClick ||
    onRowMouseOut ||
    onRowMouseOver ||
    onRowRightClick
  ) {
    a11yProps['aria-label'] = 'row';
    a11yProps.tabIndex = 0;

    if (onRowClick) {
      a11yProps.onClick = event => onRowClick({ event, index, rowData });
    }
    if (onRowDoubleClick) {
      a11yProps.onDoubleClick = event =>
        onRowDoubleClick({ event, index, rowData });
    }
    if (onRowMouseOut) {
      a11yProps.onMouseOut = event => onRowMouseOut({ event, index, rowData });
    }
    if (onRowMouseOver) {
      a11yProps.onMouseOver = event =>
        onRowMouseOver({ event, index, rowData });
    }
    if (onRowRightClick) {
      a11yProps.onContextMenu = event =>
        onRowRightClick({ event, index, rowData });
    }
  }

  // custom error style handling
  if (events[index].error) style.backgroundColor = '#FFEFF0';
  if (
    events[index].httpResponseCode &&
    parseFloat(events[index].httpResponseCode) > 399
  )
    style.backgroundColor = '#FFEFF0';
  if (events[index]['error.message'] && events[index]['error.message'] != '')
    style.backgroundColor = '#FFEFF0';

  return (
    <div
      {...a11yProps}
      className={className}
      key={key}
      role="row"
      style={style}
    >
      {columns}
    </div>
  );
};
