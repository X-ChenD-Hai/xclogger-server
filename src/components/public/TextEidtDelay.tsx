import React from "react"
import { Edit as EditIcon } from "@mui/icons-material";
import { Box, IconButton, TextField, Typography } from "@mui/material";

const TextEidtDelay = React.memo((props: { value: string, onChange: (name: string) => void, onClick?: () => void }) => {
    const [name, setName] = React.useState(props.value)
    React.useEffect(() => {
        setName(props.value)
    }, [props.value])
    const [edit, setEdit] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const handleFieldClick = React.useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => e.stopPropagation(), [])
    React.useEffect(() => {
        if (edit && inputRef.current) {
            inputRef.current.focus();
        }
    }, [inputRef, edit])
    const handleIconButtonClick = React.useCallback((e: any) => { e.stopPropagation(); setEdit(true) }, [])
    const handleTextFieldBlur = React.useCallback(() => {
        (name !== props.value) && props.onChange(name)
        setEdit(false)
    }, [name, props.value, props.onChange])
    const handelNameChange = React.useCallback((e: any) => setName(e.target.value), [setName])
    return <>
        {/* <TextField onBlur={() => props.setName(name)} value={name} onChange={(e) => setName(e.target.value)} /> */}
        <Box onClick={props.onClick} sx={{ width: "100%" }}>
            <Box display={edit ? 'none' : 'flex'}
                justifyContent='start'
                alignItems='center'>
                <Typography> {name}</Typography>
                <IconButton size='small' onClick={handleIconButtonClick}>
                    <EditIcon fontSize='inherit' />
                </IconButton>
            </Box>
            <TextField
                onClick={handleFieldClick}
                inputRef={inputRef}
                size='small'
                sx={{ display: edit ? undefined : 'none' }}
                onBlur={handleTextFieldBlur}
                value={name}
                onChange={handelNameChange} />
        </Box>
    </>
}
)

export default TextEidtDelay