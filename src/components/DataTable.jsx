import './DataTable.css'

function DataTable({ columns, rows, label }) {
  return (
    <div className="datatable__scroll">
      <table className="datatable" aria-label={label}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.className || ''} key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td className={column.className || ''} key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
