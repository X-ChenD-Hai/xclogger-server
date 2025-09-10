use cc::Build;
fn main() {
    Build::new()
        .file("src/message.cc")
        .flag("/std:c++17")
        .compile("message");
    println!("cargo:rerun-if-changed=src/msessage.cc");
}
