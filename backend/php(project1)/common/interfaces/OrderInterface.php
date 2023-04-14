<?php

namespace common\interfaces;

interface OrderInterface
{
    public function getAddress() : string;

    public function getComment() : string;

    public function toCrmItems() : array;

    public function toCrm() : array;
}
