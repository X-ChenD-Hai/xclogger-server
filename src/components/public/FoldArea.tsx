import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const FoldArea = (props: {
    header: (props: { fold: boolean, setFold: (fold: boolean) => void }) => React.ReactNode,
    children: React.ReactNode,
    defaultFold?: boolean
}) => {
    const [fold, setFold] = useState<boolean>(props.defaultFold || true);
    return (
        <>
            {props.header({ fold, setFold })}
            <AnimatePresence initial={false}>
                {fold || (
                    <motion.div
                        initial={{ marginTop: 10, marginLeft: 10, height: 0, opacity: 0 }}
                        animate={{ marginTop: 10, marginLeft: 10, opacity: 1, height: "auto" }}
                        exit={{ marginTop: 0, height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        {props.children}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default FoldArea;