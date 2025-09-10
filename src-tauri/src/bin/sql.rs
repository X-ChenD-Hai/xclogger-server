use rusqlite::{params, Connection, Result};

// 定义一个结构体来映射数据
#[derive(Debug)]
struct Person {
    id: i32,
    name: String,
    age: i32,
}

fn main() -> Result<()> {
    // 1. 打开或创建数据库连接
    // 使用 `Connection::open` 打开文件数据库，如果文件不存在会被创建。
    // 也可以使用 `Connection::open_in_memory()` 开启一个内存数据库。
    let conn = Connection::open("my_database.db")?; //[4](@ref)

    // 2. 创建表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS person (
            id   INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            age  INTEGER NOT NULL
        )",
        [], // 空参数列表
    )?; //[4](@ref)

    // 3. 插入数据 (Create)
    // 使用参数化查询防止 SQL 注入
    conn.execute(
        "INSERT INTO person (name, age) VALUES (?1, ?2)",
        params!["Alice", 30], // `params!` 宏用于传递参数
    )?; //[1,4](@ref)
    conn.execute(
        "INSERT INTO person (name, age) VALUES (?1, ?2)",
        params!["Bob", 25],
    )?;

    // 4. 查询数据 (Read)
    // 使用 `prepare` 准备语句，`query_map` 执行查询并将结果映射到结构体
    let mut stmt = conn.prepare("SELECT id, name, age FROM person")?; //[4](@ref)
    let person_iter = stmt.query_map([], |row| {
        Ok(Person {
            id: row.get(0)?,   // 获取第0列 (id)
            name: row.get(1)?, // 获取第1列 (name)
            age: row.get(2)?,  // 获取第2列 (age)
        })
    })?; //[4](@ref)

    println!("查询所有人员:");
    for person in person_iter {
        println!("Found person {:?}", person?);
    }

    // 5. 更新数据 (Update)
    // 将 Alice 的年龄更新为 31
    conn.execute(
        "UPDATE person SET age = ?1 WHERE name = ?2",
        params![31, "Alice"],
    )?; //[1](@ref)
    println!("\n更新了 Alice 的年龄。");

    // 6. 删除数据 (Delete)
    // 删除名为 Bob 的记录
    conn.execute("DELETE FROM person WHERE name = ?1", params!["Bob"])?; //[1](@ref)
    println!("删除了 Bob 的记录。");

    // 再次查询确认结果
    let mut stmt_after = conn.prepare("SELECT id, name, age FROM person")?;
    let person_iter_after = stmt_after.query_map([], |row| {
        Ok(Person {
            id: row.get(0)?,
            name: row.get(1)?,
            age: row.get(2)?,
        })
    })?;

    println!("\n更新和删除操作后的数据:");
    for person in person_iter_after {
        println!("Found person {:?}", person?);
    }

    Ok(())
}
