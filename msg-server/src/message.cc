

#pragma once
#include <algorithm>
#include <cstddef>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>
#include <cstring>

namespace xclogger
{
    class ImplCatgory;
    struct Message
    {
        std::string role;
        std::string label;
        std::string file;
        std::string function;
        size_t time;
        size_t process_id;
        size_t thread_id;
        int line;
        int level = 0;
        std::vector<std::string> messages;
        static void __encode_string(std::vector<char> &data,
                                    const std::string &str)
        {
            size_t size = str.size();
            data.insert(data.end(), (char *)&size, (char *)&size + sizeof(size_t));
            data.insert(data.end(), str.begin(), str.end());
        }
        static std::vector<char> encode(const Message &msg)
        {
            std::vector<char> data;
            for (auto &it : {msg.role, msg.label, msg.file, msg.function})
                __encode_string(data, it);
            for (auto it : {msg.time, msg.process_id, msg.thread_id})
                data.insert(data.end(), (char *)&it, (char *)&it + sizeof(size_t));
            for (auto it : {msg.line, msg.level})
                data.insert(data.end(), (char *)&it, (char *)&it + sizeof(int));
            std::for_each(
                msg.messages.begin(), msg.messages.end(),
                [&data](const std::string &str)
                { __encode_string(data, str); });
            return data;
        }
        static Message decode(const char *data, size_t size)
        {
            Message msg;
            size_t offset = 0;
            auto decode_string = [&](std::string &str)
            {
                if (offset + sizeof(size_t) > size)
                    throw std::runtime_error("decode string failed");
                size_t str_size = *(size_t *)(data + offset);
                offset += sizeof(size_t);
                if (offset + str_size > size)
                    throw std::runtime_error("decode string failed");
                str = std::string(data + offset, str_size);
                offset += str_size;
            };
            for (auto &it : {&msg.role, &msg.label, &msg.file, &msg.function})
                decode_string(*it);
            for (auto it : {&msg.time, &msg.process_id, &msg.thread_id})
            {
                if (offset + sizeof(size_t) > size)
                    throw std::runtime_error("decode size_t failed");
                *it = *(size_t *)(data + offset);
                offset += sizeof(size_t);
            }
            for (auto it : {&msg.line, &msg.level})
            {
                if (offset + sizeof(int) > size)
                    throw std::runtime_error("decode int failed");
                *it = *(int *)(data + offset);
                offset += sizeof(int);
            }
            while (offset < size)
            {
                std::string str;
                decode_string(str);
                msg.messages.emplace_back(std::move(str));
            }
            return msg;
        }
        static size_t hash(const std::vector<char> &data)
        {
            return std::hash<std::string_view>{}(std::string_view(
                reinterpret_cast<const char *>(data.data()), data.size()));
        }
    };
    template <class T = ImplCatgory>
    inline std::ostream &operator<<(std::ostream &o, const Message &msg)
    {
        o << "[" << msg.file << ":" << msg.line << "]"
          << "[" << msg.function << "]"
          << "[" << msg.role << "]"
          << "[" << msg.label << "]"
          << "[" << msg.process_id << "]"
          << "[" << msg.thread_id << "]"
          << "[" << msg.time << "us]"
          << "[level=" << msg.level << "] ";
        for (const auto &m : msg.messages)
            o << m << " ";
        std::cout << std::endl;
        return o;
    }
} // namespace xclogger
#define XCLOG_MSG_OSTREAM_IMPT(out_arg, msg_arg)                \
    template <>                                                 \
    std::ostream &xclogger::operator<< <xclogger::ImplCatgory>( \
        std::ostream & out_arg, const Message &msg_arg)

extern "C"
{
    struct XCLOGMessage
    {
        const char *role;
        const char *label;
        const char *file;
        const char *function;
        size_t time;
        size_t process_id;
        size_t thread_id;
        int line;
        int level;
        const char **messages;
        size_t messages_size;
    };

    // Encode a message to binary format
    char *XCLOGMessage_encode(const XCLOGMessage *msg, size_t *out_size)
    {
        xclogger::Message cpp_msg;
        cpp_msg.role = msg->role ? std::string(msg->role) : "";
        cpp_msg.label = msg->label ? std::string(msg->label) : "";
        cpp_msg.file = msg->file ? std::string(msg->file) : "";
        cpp_msg.function = msg->function ? std::string(msg->function) : "";
        cpp_msg.time = msg->time;
        cpp_msg.process_id = msg->process_id;
        cpp_msg.thread_id = msg->thread_id;
        cpp_msg.line = msg->line;
        cpp_msg.level = msg->level;

        for (size_t i = 0; i < msg->messages_size; i++)
        {
            if (msg->messages[i])
            {
                cpp_msg.messages.emplace_back(msg->messages[i]);
            }
        }

        std::vector<char> encoded = xclogger::Message::encode(cpp_msg);
        *out_size = encoded.size();

        char *result = new char[encoded.size()];
        std::copy(encoded.begin(), encoded.end(), result);
        std::cout << "C++: ptr:" << (void *)result << " size:" << *out_size << " encoded size: " << encoded.size() << std::endl;
        return result;
    }

    // Decode binary data to a message
    XCLOGMessage *XCLOGMessage_decode(const char *data, size_t size)
    {
        xclogger::Message cpp_msg = xclogger::Message::decode(data, size);

        XCLOGMessage *msg = new XCLOGMessage();
        msg->role = new char[cpp_msg.role.size() + 1];
        std::strcpy(const_cast<char *>(msg->role), cpp_msg.role.c_str());
        msg->label = new char[cpp_msg.label.size() + 1];
        std::strcpy(const_cast<char *>(msg->label), cpp_msg.label.c_str());
        msg->file = new char[cpp_msg.file.size() + 1];
        std::strcpy(const_cast<char *>(msg->file), cpp_msg.file.c_str());
        msg->function = new char[cpp_msg.function.size() + 1];
        std::strcpy(const_cast<char *>(msg->function), cpp_msg.function.c_str());
        msg->time = cpp_msg.time;
        msg->process_id = cpp_msg.process_id;
        msg->thread_id = cpp_msg.thread_id;
        msg->line = cpp_msg.line;
        msg->level = cpp_msg.level;

        msg->messages_size = cpp_msg.messages.size();
        msg->messages = new const char *[cpp_msg.messages.size()];
        for (size_t i = 0; i < cpp_msg.messages.size(); i++)
        {
            msg->messages[i] = new char[cpp_msg.messages[i].size() + 1];
            std::strcpy(const_cast<char *>(msg->messages[i]), cpp_msg.messages[i].c_str());
        }

        return msg;
    }

    // Free encoded data
    void XCLOGMessage_free_encoded_data(char *data)
    {
        std::cout << "C++: free encoded data ptr:" << (void *)data << std::endl;
        delete[] data;
    }
    size_t XCLOGMessage_hash(const char *data, size_t size)
    {
        std::vector<char> vec(data, data + size);
        return xclogger::Message::hash(vec);
    }
}
